import HttpError from './index'

export default class HttpStatusUnavailableForLegalReasons extends HttpError {
  public get status() {
    return 451
  }
}
