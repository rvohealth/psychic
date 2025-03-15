import HttpError from './index.js.js'

export default class HttpStatusConflict extends HttpError {
  public get status() {
    return 409
  }
}
