import Koa from 'koa'
import HttpError from '../../error/http/index.js'
import errorIsRescuableHttpError from './errorIsRescuableHttpError.js'

/**
 * @internal
 *
 * The error Koa's `ctx.throw` creates (an `http-errors` error).
 */
export type KoaHttpError = InstanceType<typeof Koa.HttpError>

/**
 * @internal
 *
 * Whether an error is a deliberate 5xx: a 501–510 status that app code
 * raised on purpose. Psychic answers it as a normal handled response (sent
 * with its status, not logged as a server error, and never passed to
 * `server:error` hooks) whether it was thrown from a controller action (the
 * router) or from middleware (the error boundary). It is either:
 *
 * - a psychic `HttpError` other than 500, e.g. from `this.serviceUnavailable()`
 * - an error from Koa's `ctx.throw(501–510)` (see
 *   {@link errorIsDeliberateKoaServerError})
 *
 * Everything else stays a server error: a 500, a non-HTTP exception, and an
 * error from any other library that merely carries a `status` (e.g. an
 * uncaught Google API client error mirroring an upstream 503). The framework
 * cannot tell that such an error came from an upstream call; translating an
 * upstream failure into a response status is the app's job, done by catching
 * the error.
 */
export default function errorIsDeliberateServerError(err: unknown): boolean {
  return (
    (errorIsRescuableHttpError(err) && (err as HttpError).status >= 500) ||
    errorIsDeliberateKoaServerError(err)
  )
}

/**
 * @internal
 *
 * Whether an error is a deliberate 5xx created by Koa's `ctx.throw(501–510)`:
 * an `http-errors` error, including one from another library built on that
 * package (e.g. Koa's `ctx.assert`).
 *
 * Recognized by the http-errors `isHttpError` shape test (an `Error` with a
 * boolean `expose` and a numeric `statusCode` equal to `status`) rather than
 * by `instanceof Koa.HttpError`, because Koa's documented wrapped form,
 * `ctx.throw(503, caughtError)`, decorates the caught error in place, so it
 * keeps its own prototype. The shape test still rejects an error that merely
 * carries a `status` (e.g. Google's `GaxiosError`) or only a `statusCode`.
 */
export function errorIsDeliberateKoaServerError(err: unknown): err is KoaHttpError {
  if (!(err instanceof Error)) return false

  try {
    const { expose, statusCode } = err as Partial<KoaHttpError>
    return (
      typeof expose === 'boolean' &&
      typeof statusCode === 'number' &&
      statusCode >= 501 &&
      statusCode <= 510 &&
      (err as KoaHttpError).status === statusCode
    )
  } catch {
    // a throwing property getter means this is not an http-errors error
    return false
  }
}

/**
 * @internal
 *
 * Applies the headers passed to Koa's `ctx.throw` (e.g.
 * `ctx.throw(503, { headers: { 'Retry-After': '120' } })`) to the response,
 * as Koa's own error handler does; the developer passed them on purpose.
 */
export function setKoaHttpErrorHeaders(ctx: Koa.Context, err: KoaHttpError) {
  if (err.headers && typeof err.headers === 'object') ctx.set(err.headers)
}
