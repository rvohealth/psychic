import HttpError from './index.js'

export default class HttpStatusImATeapot extends HttpError {
  public override get status() {
    return 418
  }
}
