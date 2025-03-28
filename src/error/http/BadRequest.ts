import HttpError from './index.js'

export default class HttpStatusBadRequest extends HttpError {
  public override get status() {
    return 400
  }
}
