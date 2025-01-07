import HttpError from './index'

export default class Conflict extends HttpError {
  public get status() {
    return 409
  }
}
