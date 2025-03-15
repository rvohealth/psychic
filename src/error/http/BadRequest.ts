import HttpError from './index.js.js'

export default class HttpStatusBadRequest extends HttpError {
  public get status() {
    return 400
  }
}
