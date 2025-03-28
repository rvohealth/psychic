import HttpError from './index.js'

export default class HttpStatusUnavailableForLegalReasons extends HttpError {
  public override get status() {
    return 451
  }
}
