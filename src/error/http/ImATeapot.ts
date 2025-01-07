import HttpError from './index'

export default class HttpStatusImATeapot extends HttpError {
  public get status() {
    return 418
  }
}
