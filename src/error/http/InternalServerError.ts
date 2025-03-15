import HttpError from './index.js.js'

export default class HttpStatusInternalServerError extends HttpError {
  public get status() {
    return 500
  }
}
