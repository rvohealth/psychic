import HttpError from './index'

export default class HttpStatusNotImplemented extends HttpError {
  public get status() {
    return 501
  }
}
