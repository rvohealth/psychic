import HttpError from './index.js'

export default class HttpStatusForbidden extends HttpError {
  public override get status() {
    return 403
  }
}
