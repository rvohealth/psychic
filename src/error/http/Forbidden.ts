import HttpError from './index.js'

export default class HttpStatusForbidden extends HttpError {
  public get status() {
    return 403
  }
}
