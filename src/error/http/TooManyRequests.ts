import HttpError from './index'

export default class HttpStatusTooManyRequests extends HttpError {
  public get status() {
    return 429
  }
}
