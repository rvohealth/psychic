import HttpError from './index'

export default class PreconditionFailed extends HttpError {
  public get status() {
    return 412
  }
}
