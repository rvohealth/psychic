import HttpError from './index'

export default class HttpStatusBadRequest extends HttpError {
  public get status() {
    return 400
  }
}
