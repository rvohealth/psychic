import HttpError from './index'

export default class HttpVersionNotSupported extends HttpError {
  public get status() {
    return 505
  }
}
