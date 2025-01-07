import HttpError from './index'

export default class HttpStatusPreconditionRequired extends HttpError {
  public get status() {
    return 428
  }
}
