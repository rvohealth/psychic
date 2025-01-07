import HttpError from './index'

export default class HttpStatusContentTooLarge extends HttpError {
  public get status() {
    return 413
  }
}
