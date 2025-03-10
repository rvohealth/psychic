import HttpError from './index.js'

export default class HttpStatusUnauthorized extends HttpError {
  public get status() {
    return 401
  }
}
