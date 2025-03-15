import HttpError from './index.js.js'

export default class HttpStatusGone extends HttpError {
  public get status() {
    return 410
  }
}
