import HttpError from './index.js'

export default class HttpStatusUnauthorized extends HttpError {
  public override get status() {
    return 401
  }
}
