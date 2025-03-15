import HttpError from './index.js'

export default class HttpStatusUnavailableForLegalReasons extends HttpError {
  public get status() {
    return 451
  }
}
