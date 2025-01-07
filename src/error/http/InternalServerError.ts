import HttpError from './index'

export default class HttpStatusInternalServerError extends HttpError {
  public get status() {
    return 500
  }
}
