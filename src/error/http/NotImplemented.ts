import HttpError from './index.js'

export default class HttpStatusNotImplemented extends HttpError {
  public override get status() {
    return 501
  }
}
