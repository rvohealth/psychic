import HttpError from './index'

export default class MethodNotAllowed extends HttpError {
  public get status() {
    return 405
  }
}
