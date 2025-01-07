import HttpError from './index'

export default class HttpStatusInsufficientStorage extends HttpError {
  public get status() {
    return 507
  }
}
