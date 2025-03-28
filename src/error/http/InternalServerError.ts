import HttpError from './index.js'

export default class HttpStatusInternalServerError extends HttpError {
  public override get status() {
    return 500
  }
}
