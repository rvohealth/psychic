import HttpError from './index'

export default class HttpStatusMisdirectedRequest extends HttpError {
  public get status() {
    return 421
  }
}
