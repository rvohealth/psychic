import HttpError from './index.js.js'

export default class HttpStatusNotImplemented extends HttpError {
  public get status() {
    return 501
  }
}
