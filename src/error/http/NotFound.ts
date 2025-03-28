import HttpError from './index.js'

export default class HttpStatusNotFound extends HttpError {
  public override get status() {
    return 404
  }
}
