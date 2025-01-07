import HttpError from './index'

export default class NotAcceptable extends HttpError {
  public get status() {
    return 406
  }
}
