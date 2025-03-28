import HttpError from './index.js'

export default class HttpStatusExpectationFailed extends HttpError {
  public override get status() {
    return 417
  }
}
