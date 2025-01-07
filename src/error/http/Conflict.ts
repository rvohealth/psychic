import HttpError from './index'

export default class HttpStatusConflict extends HttpError {
  public get status() {
    return 409
  }
}
