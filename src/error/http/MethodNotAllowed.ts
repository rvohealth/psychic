import HttpError from './index.js'

export default class HttpStatusMethodNotAllowed extends HttpError {
  public override get status() {
    return 405
  }
}
