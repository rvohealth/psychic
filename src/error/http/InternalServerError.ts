import HttpError from './index'

export default class InternalServerError extends HttpError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get status() {
    return 500
  }
}
