import HttpError from './index'

export default class NotExtended extends HttpError {
  public get status() {
    return 510
  }
}
