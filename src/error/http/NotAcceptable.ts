import HttpError from './index.js'

export default class HttpStatusNotAcceptable extends HttpError {
  public override get status() {
    return 406
  }
}
