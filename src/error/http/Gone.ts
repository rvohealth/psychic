import HttpError from './index.js'

export default class HttpStatusGone extends HttpError {
  public override get status() {
    return 410
  }
}
