import HttpError from './index.js'

export default class HttpStatusContentTooLarge extends HttpError {
  public override get status() {
    return 413
  }
}
