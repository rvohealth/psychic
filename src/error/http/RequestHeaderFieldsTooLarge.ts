import HttpError from './index.js'

export default class HttpStatusRequestHeaderFieldsTooLarge extends HttpError {
  public override get status() {
    return 431
  }
}
