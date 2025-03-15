import HttpError from './index.js'

export default class HttpStatusContentTooLarge extends HttpError {
  public get status() {
    return 413
  }
}
