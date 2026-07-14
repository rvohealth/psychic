import Koa from 'koa'
import * as util from 'node:util'
import HttpError from '../../error/http/index.js'
import EnvInternal from '../../helpers/EnvInternal.js'
import PsychicApp from '../../psychic-app/index.js'

export const ERROR_LOGGING_DEPTH = 6

/**
 * @internal
 *
 * Set on `ctx.state` by the router when it processes an error thrown from a
 * controller action (running `server:error` hooks when any are registered,
 * or deliberately re-throwing to Koa when none are). The error boundary
 * passes marked errors through untouched so a single request can never run
 * `server:error` hooks twice, and so the router's deliberate dev/test
 * re-throw behavior reaches Koa exactly as it did before the boundary
 * existed.
 */
export const psychicRouterProcessedErrorStateKey = '_psychicRouterProcessedError'

/**
 * @internal
 *
 * The outermost middleware psychic mounts. Everything mounted after it —
 * secure default headers, etag, cors, the body parser, `psy.use` middleware,
 * after-routes mounts, and the router itself — runs inside `await next()`,
 * so any error those layers throw (and the router doesn't catch) lands here
 * instead of falling through to Koa's default handler.
 *
 * Errors carrying a 4xx status (e.g. a body-parser 400, or an `HttpError`
 * thrown from custom middleware) already name their response: the boundary
 * renders that status without involving `server:error` hooks. Anything else
 * is a genuine server error: it is logged, given a default 500 response, and
 * escalated to `server:error` hooks, which may reshape the response.
 */
export default function errorBoundaryMiddleware(): Koa.Middleware {
  return async function psychicErrorBoundary(ctx, next) {
    try {
      await next()
    } catch (error) {
      const err = error as Error

      // the router already processed this error (see the state key docs
      // above); let it reach Koa unchanged
      if (ctx.state[psychicRouterProcessedErrorStateKey]) throw err

      // once headers are out, the response can no longer be shaped; Koa's
      // ctx.onerror knows how to clean up the socket, and the app-level
      // 'error' listener registered by PsychicServer will log it
      if (ctx.headerSent) throw err

      const status = statusFromError(err)

      if (status !== null && status < 500) {
        // client-shaped errors are a handled response, not a server error;
        // server:error hooks are never called for them
        ctx.status = status
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        ctx.body = err instanceof HttpError && err.data !== undefined ? err.data : ''
        return
      }

      PsychicApp.logWithLevel('error', util.inspect(err, { depth: ERROR_LOGGING_DEPTH }))

      // default server-error response; server:error hooks may reshape it
      ctx.status = status ?? 500
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ctx.body = err instanceof HttpError && err.data !== undefined ? err.data : ''

      try {
        for (const hook of PsychicApp.getOrFail().specialHooks.serverError) {
          await hook(err, ctx)
        }
      } catch (hookError) {
        if (EnvInternal.isDevelopmentOrTest) {
          // mirror the router's deliberate dev/test behavior for throwing
          // server:error hooks: surface the hook error so specs can see it
          throw hookError
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
