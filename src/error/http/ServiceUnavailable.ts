import HttpError from './index.js'

export default class HttpStatusServiceUnavailable extends HttpError {
  public override get status() {
    return 503
  }
}
