import HttpError from './index.js'

export default class HttpStatusNotFound extends HttpError {
  public get status() {
    return 404
  }
}
