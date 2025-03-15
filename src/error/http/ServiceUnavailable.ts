import HttpError from './index.js'

export default class HttpStatusServiceUnavailable extends HttpError {
  public get status() {
    return 503
  }
}
