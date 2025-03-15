import HttpError from './index.js.js'

export default class HttpStatusServiceUnavailable extends HttpError {
  public get status() {
    return 503
  }
}
