import HttpError from './index.js'

export default class HttpStatusTooManyRequests extends HttpError {
  public get status() {
    return 429
  }
}
