import HttpError from './index'

export default class InsufficientStorage extends HttpError {
  public get status() {
    return 507
  }
}
