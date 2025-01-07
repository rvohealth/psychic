import HttpError from './index'

export default class HttpStatusRequestHeaderFieldsTooLarge extends HttpError {
  public get status() {
    return 431
  }
}
