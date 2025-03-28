import HttpError from './index.js'

export default class HttpStatusMisdirectedRequest extends HttpError {
  public override get status() {
    return 421
  }
}
