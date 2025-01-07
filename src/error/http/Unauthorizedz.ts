import HttpError from './index'

export default class Unauthorized extends HttpError {
  public get status() {
    return 401
  }
}
