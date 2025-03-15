import HttpError from './index.js.js'

export default class HttpStatusExpectationFailed extends HttpError {
  public get status() {
    return 417
  }
}
