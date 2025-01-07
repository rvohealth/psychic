import HttpError from './index'

export default class ExpectationFailed extends HttpError {
  public get status() {
    return 417
  }
}
