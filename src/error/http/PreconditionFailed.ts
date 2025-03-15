import HttpError from './index.js'

export default class HttpStatusPreconditionFailed extends HttpError {
  public get status() {
    return 412
  }
}
