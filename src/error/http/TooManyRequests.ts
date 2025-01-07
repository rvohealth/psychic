import HttpError from './index'

export default class PreconditionRequired extends HttpError {
  public get status() {
    return 428
  }
}
