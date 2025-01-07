import HttpError from './index'

export default class HttpStatusNotFound extends HttpError {
  public get status() {
    return 404
  }
}
