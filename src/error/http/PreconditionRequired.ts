import HttpError from './index.js'

export default class HttpStatusPreconditionRequired extends HttpError {
  public override get status() {
    return 428
  }
}
