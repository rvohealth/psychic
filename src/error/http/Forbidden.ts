import HttpError from './index'

export default class HttpStatusForbidden extends HttpError {
  public get status() {
    return 403
  }
}
