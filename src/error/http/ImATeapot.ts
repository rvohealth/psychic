import HttpError from './index.js.js'

export default class HttpStatusImATeapot extends HttpError {
  public get status() {
    return 418
  }
}
