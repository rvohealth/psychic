import HttpError from './index'

export default class HttpStatusGone extends HttpError {
  public get status() {
    return 410
  }
}
