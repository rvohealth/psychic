import HttpError from './index'

export default class HttpStatusMethodNotAllowed extends HttpError {
  public get status() {
    return 405
  }
}
