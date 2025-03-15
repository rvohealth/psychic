import HttpError from './index.js'

export default class HttpStatusMethodNotAllowed extends HttpError {
  public get status() {
    return 405
  }
}
