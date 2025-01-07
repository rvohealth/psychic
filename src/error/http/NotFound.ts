import HttpError from './index'

export default class NotFound extends HttpError {
  public get status() {
    return 404
  }
}
