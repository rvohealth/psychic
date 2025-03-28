import HttpError from './index.js'

export default class HttpStatusConflict extends HttpError {
  public override get status() {
    return 409
  }
}
