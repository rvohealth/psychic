import HttpError from './index.js'

/**
 * 500 Internal Server Error. `data` is for server-side diagnostics only:
 * it is logged but never sent to the client.
 */
export default class HttpStatusInternalServerError extends HttpError {
  public override get status() {
    return 500
  }
}
