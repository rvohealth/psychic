import Koa from 'koa'
import * as util from 'node:util'
import HttpError from '../../error/http/index.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import errorIsDeliberateHttpError, {
  errorIsDeliberateKoaHttpError,
  setKoaHttpErrorHeaders,
} from '../../helpers/error/errorIsDeliberateHttpError.js'
import errorIsFromBodyParser from '../../helpers/error/errorIsFromBodyParser.js'
import errorIsRethrownHookError from '../../helpers/error/errorIsRethrownHookError.js'
import errorKoaCanHandle from '../../helpers/error/errorKoaCanHandle.js'
import renderSerializerBuilders from '../../helpers/renderSerializerBuilders.js'
import PsychicApp from '../../psychic-app/index.js'

export const ERROR_LOGGING_DEPTH = 6

/**
 * @internal
 *
 * The outermost middleware psychic mounts. Everything mounted after it —
 * secure default headers, etag, cors, the body parser, `psy.use` middleware,
 * after-routes mounts, and the router itself — runs inside `await next()`,
 * so any error those layers throw (and the router doesn't catch) lands here
 * instead of falling through to Koa's default handler.
 *
 * Some errors already name their response. The boundary renders their
 * status as a handled response, without logging them as server errors or
 * involving `server:error` hooks:
 *
 * - deliberate http errors: a psychic `HttpError` other than 500 (e.g. one
 *   thrown from custom middleware), or a Koa `ctx.throw` with a 4xx or
 *   501–510 status, with the headers passed to it (see
 *   `errorIsDeliberateHttpError`; the router answers these the same way for
 *   a controller action)
 * - the body parser's own 4xx errors, e.g. a 400 for malformed JSON or a 413
 *   for a body over the size limit (see `errorIsFromBodyParser`)
 *
 * Anything else is a genuine server error, including a 500 and another
 * library's error that merely carries a 4xx or 5xx `status`: it is logged,
 * given a default response of 500 with an empty body, whatever status or
 * data the error carries (the router gives a server error from a controller
 * action the same default), and escalated to `server:error` hooks, which
 * may reshape the response. When the hooks set no response, the default is
 * sent. A server error's data, e.g. an `HttpStatusInternalServerError`'s,
 * is logged with it but never sent to the client.
 *
 * That holds for an error thrown on a request whose controller action's
 * server error the router has already answered, e.g. by middleware around
 * the router after `await next()`. The router itself throws only one error
 * after answering a server error: in development and test, a failing
 * `server:error` hook's (see `errorIsRethrownHookError`), which the boundary
 * passes through to Koa untouched, so the hooks never run a second time for
 * it.
 */
export default function errorBoundaryMiddleware(): Koa.Middleware {
  return async function psychicErrorBoundary(ctx, next) {
    try {
      await next()
    } catch (error) {
      const err = error as Error

      // a failing server:error hook's error, which the router re-threw in
      // development and test after answering a controller action's server
      // error; let it reach Koa unchanged
      if (errorIsRethrownHookError(err)) throw err

      // once headers are out, the response can no longer be shaped; Koa's
      // ctx.onerror knows how to clean up the socket, and the app-level
      // 'error' listener registered by PsychicServer will log it. It is
      // handed an error it can mark as `headerSent` (not a frozen one)
      if (ctx.headerSent) throw errorKoaCanHandle(err)

      const status = statusFromError(err)

      if (
        status !== null &&
        (errorIsDeliberateHttpError(err) || (status < 500 && errorIsFromBodyParser(err)))
      ) {
        // deliberate http errors and the body parser's own 4xx errors are a
        // handled response, not a server error; server:error hooks are never
        // called for them
        if (errorIsDeliberateKoaHttpError(err)) setKoaHttpErrorHeaders(ctx, err)
        ctx.status = status
        ctx.body = httpErrorBody(err)
        return
      }

      PsychicApp.logWithLevel('error', util.inspect(err, { depth: ERROR_LOGGING_DEPTH }))

      // default server-error response, whatever status or data the error
      // carries (a server error's data is never sent); server:error hooks
      // may reshape it. Middleware that opted out of Koa's response
      // (`ctx.respond = false`) and failed before sending anything has given
      // that response up, so Koa sends this one
      ctx.status = 500
      ctx.body = ''
      ctx.respond = true

      try {
        for (const hook of PsychicApp.getOrFail().specialHooks.serverError) {
          await hook(err, ctx)
        }
      } catch (hookError) {
        if (EnvInternal.isDevelopmentOrTest) {
          // mirror the router's deliberate dev/test behavior for throwing
          // server:error hooks: surface the hook error so specs can see it,
          // as an error Koa's default error handler can respond to
          throw errorKoaCanHandle(hookError)
        } else {
          PsychicApp.logWithLevel(
            'error',
            `
              Something went wrong while attempting to call your custom server:error hooks.
              Psychic will rescue errors thrown here to prevent the server from crashing.
              The error thrown is:
            `,
          )
          PsychicApp.logWithLevel('error', hookError)
        }
      }
    }
  }
}

/**
 * @internal
 *
 * Extracts an http response status from an error when the error names one:
 * psychic `HttpError` subclasses, Koa `ctx.throw`/http-errors errors, and
 * body-parser failures all carry a numeric `status`. Guarded property access
 * because the base `HttpError#status` getter throws.
 */
function statusFromError(err: unknown): number | null {
  try {
    const status = (err as { status?: unknown } | null)?.status
    if (typeof status === 'number' && status >= 400 && status <= 599) return status
    return null
  } catch {
    return null
  }
}

/**
 * @internal
 *
 * The response body for an error the boundary answers as a handled response
 * (a deliberate http error, or the body parser's own 4xx error): an
 * `HttpError`'s data, with serializer builders rendered (there is no
 * controller here, so no serializer passthrough), or an empty body. Never
 * used for a server error, whose data is never sent.
 */
function httpErrorBody(err: Error) {
  return err instanceof HttpError && err.data !== undefined ? renderSerializerBuilders(err.data) : ''
}
