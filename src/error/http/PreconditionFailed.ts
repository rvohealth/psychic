import HttpError from './index'

export default class HttpStatusPreconditionFailed extends HttpError {
  public get status() {
    return 412
  }
}
