import HttpError from './index.js.js'

export default class HttpStatusMisdirectedRequest extends HttpError {
  public get status() {
    return 421
  }
}
