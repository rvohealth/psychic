import HttpError from './index'

export default class HttpStatusUnauthorized extends HttpError {
  public get status() {
    return 401
  }
}
