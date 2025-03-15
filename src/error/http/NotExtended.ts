import HttpError from './index.js'

export default class HttpStatusNotExtended extends HttpError {
  public get status() {
    return 510
  }
}
