import HttpError from './index.js'

export default class HttpStatusExpectationFailed extends HttpError {
  public get status() {
    return 417
  }
}
