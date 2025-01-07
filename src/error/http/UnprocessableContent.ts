import HttpError from './index'

export default class HttpStatusUnprocessableContent extends HttpError {
  public get status() {
    return 422
  }
}
