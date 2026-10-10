import Koa from 'koa'
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
 * Whether an error is a deliberate http error: a 4xx or 501–510 status that
 * app code or the framework raised on purpose. Psychic answers it as a
 * normal handled response (sent with its status, not logged as a server
 * error, and never passed to `server:error` hooks) whether it was thrown
 * from a controller action (the router) or from middleware (the error
 * boundary). It is either:
 *
 * - a psychic `HttpError` other than 500, e.g. from `this.notFound()` or
 *   `this.serviceUnavailable()`
 * - an error from Koa's `ctx.throw` with a 4xx or 501–510 status (see
 *   {@link errorIsDeliberateKoaHttpError})
 *
 * The error boundary also answers the body parser's own 4xx errors (e.g. a
 * 400 for malformed JSON) as handled responses; see `errorIsFromBodyParser`.
 *
 * Everything else is a server error: a 500, a 511, a non-HTTP exception, and
 * an error from any other library that merely carries a `status`, 4xx or 5xx
 * (e.g. an uncaught API client error mirroring an upstream 401 or 503). The
 * framework cannot tell that such an error came from an upstream call;
 * translating an upstream failure into a response status is the app's job,
 * done by catching the error, reporting it if it should be tracked, and
 * calling one of Psychic's status helpers (e.g. `this.serviceUnavailable()`
 * in a controller). Passing the caught error to `ctx.throw` instead does not
 * set the status when the error carries its own: Koa keeps that status (see
 * {@link errorIsDeliberateKoaHttpError}), and Psychic leaves that as Koa
 * decides.
 */
export default function errorIsDeliberateHttpError(err: unknown): boolean {
  return errorIsRescuableHttpError(err) || errorIsDeliberateKoaHttpError(err)
}

/**
 * @internal
 *
 * Whether an error is a deliberate http error created by Koa's `ctx.throw`
 * with a 4xx or 501–510 status: an `http-errors` error, including one from
 * another library built on that package (e.g. Koa's `ctx.assert`).
 *
 * Recognized by the http-errors `isHttpError` shape test (an `Error` with a
 * boolean `expose` and a numeric `statusCode` equal to `status`) rather than
 * by `instanceof Koa.HttpError`, because Koa's documented wrapped form,
 * `ctx.throw(404, caughtError)`, decorates the caught error in place, so it
 * keeps its own prototype. The shape test still rejects an error that merely
 * carries a `status` (e.g. Google's `GaxiosError`) or only a `statusCode`.
 *
 * In the wrapped form, Koa (through `http-errors`) keeps the caught error's
 * own `status` (or `statusCode`) and uses the status passed only when the
 * error has none. So `ctx.throw(503, caughtError)`, where `caughtError` is
 * an upstream SDK error carrying a 401 (e.g. stripe-node's for a rejected
 * API key), is a deliberate 401 here, answered with no log and no
 * `server:error` hook call, not a 503. Psychic leaves that as Koa decides: a
 * controller sets a deliberate status with Psychic's helpers (e.g.
 * `this.serviceUnavailable()`), not by passing a caught error to `ctx.throw`.
 */
export function errorIsDeliberateKoaHttpError(err: unknown): err is KoaHttpError {
  if (!(err instanceof Error)) return false

  try {
    const { expose, statusCode } = err as Partial<KoaHttpError>
    return (
      typeof expose === 'boolean' &&
      typeof statusCode === 'number' &&
      ((statusCode >= 400 && statusCode <= 499) || (statusCode >= 501 && statusCode <= 510)) &&
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
 * `ctx.throw(401, { headers: { 'WWW-Authenticate': 'Bearer' } })` or
 * `ctx.throw(503, { headers: { 'Retry-After': '120' } })`) to the response,
 * as Koa's own error handler does; the developer passed them on purpose.
 *
 * Only an error that Koa's `http-errors` created itself
 * (`instanceof Koa.HttpError`) has its headers applied. The wrapped form,
 * `ctx.throw(503, caughtError)`, decorates the caught error in place (and
 * keeps its own status when it has one; see
 * {@link errorIsDeliberateKoaHttpError}), so its `headers` may be the
 * upstream response's own (stripe-node's `StripeError` copies them there:
 * CORS headers, request ids, a JSON content type), and they must never
 * reach the client. The decorated error cannot tell those apart from headers
 * passed alongside it, so `ctx.throw(503, caughtError, { headers })` applies
 * neither. An error made by another copy of `http-errors` (e.g.
 * `ctx.assert`'s, through `http-assert`) is not a `Koa.HttpError` either, so
 * its headers are not applied.
 */
export function setKoaHttpErrorHeaders(ctx: Koa.Context, err: KoaHttpError) {
  if (!(err instanceof Koa.HttpError)) return
  if (err.headers && typeof err.headers === 'object') ctx.set(err.headers)
}
