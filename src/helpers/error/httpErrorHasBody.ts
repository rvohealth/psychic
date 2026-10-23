import HttpError from '../../error/http/index.js'

/**
 * @internal
 *
 * Whether a psychic `HttpError` answered with its own status as a handled
 * response (a 4xx, or a 501–510) sends its data as the response body: any
 * data but `undefined` or `null`. `0`, `false` and `''` are data, sent as
 * JSON like any other. An error without data is answered with its status
 * and an empty body, never a 204.
 *
 * Read by both request paths, so they agree: the router, for an error from a
 * controller action, and the error boundary, for one from middleware.
 */
export default function httpErrorHasBody(err: HttpError): boolean {
  return err.data !== undefined && err.data !== null
}
