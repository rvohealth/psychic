import HttpError from './index'

export default class HttpStatusNotExtended extends HttpError {
  public get status() {
    return 510
  }
}
