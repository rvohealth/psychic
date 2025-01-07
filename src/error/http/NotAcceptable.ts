import HttpError from './index'

export default class HttpStatusNotAcceptable extends HttpError {
  public get status() {
    return 406
  }
}
