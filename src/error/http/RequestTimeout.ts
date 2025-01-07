import HttpError from './index'

export default class RequestTimeout extends HttpError {
  public get status() {
    return 408
  }
}
