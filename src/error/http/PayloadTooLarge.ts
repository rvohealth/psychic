import HttpError from './index'

export default class PayloadTooLarge extends HttpError {
  public get status() {
    return 413
  }
}
