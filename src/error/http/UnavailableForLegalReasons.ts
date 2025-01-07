import HttpError from './index'

export default class UnavailableForLegalReasons extends HttpError {
  public get status() {
    return 451
  }
}
