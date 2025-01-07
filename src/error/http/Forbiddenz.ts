import HttpError from './index'

export default class Forbidden extends HttpError {
  public get status() {
    return 403
  }
}
