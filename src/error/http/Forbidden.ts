import HttpError from './index.js.js'

export default class HttpStatusForbidden extends HttpError {
  public get status() {
    return 403
  }
}
