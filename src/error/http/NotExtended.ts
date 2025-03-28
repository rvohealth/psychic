import HttpError from './index.js'

export default class HttpStatusNotExtended extends HttpError {
  public override get status() {
    return 510
  }
}
