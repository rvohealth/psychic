import HttpError from './index'

export default class RequestHeaderFieldsTooLarge extends HttpError {
  public get status() {
    return 431
  }
}
