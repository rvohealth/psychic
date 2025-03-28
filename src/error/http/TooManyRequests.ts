import HttpError from './index.js'

export default class HttpStatusTooManyRequests extends HttpError {
  public override get status() {
    return 429
  }
}
