import HttpError from './index.js.js'

export default class HttpStatusInsufficientStorage extends HttpError {
  public get status() {
    return 507
  }
}
