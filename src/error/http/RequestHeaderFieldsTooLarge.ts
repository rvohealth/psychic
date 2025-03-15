import HttpError from './index.js'

export default class HttpStatusRequestHeaderFieldsTooLarge extends HttpError {
  public get status() {
    return 431
  }
}
