import HttpError from './index.js'

export default class HttpStatusInsufficientStorage extends HttpError {
  public override get status() {
    return 507
  }
}
