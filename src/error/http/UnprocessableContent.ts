import HttpError from './index.js'

export default class HttpStatusUnprocessableContent extends HttpError {
  public get status() {
    return 422
  }
}
