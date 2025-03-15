import HttpError from './index.js.js'

export default class HttpStatusNotAcceptable extends HttpError {
  public get status() {
    return 406
  }
}
