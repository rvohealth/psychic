import HttpError from './index.js'

export default class HttpStatusPreconditionRequired extends HttpError {
  public get status() {
    return 428
  }
}
