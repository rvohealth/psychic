import HttpError from './index.js'

export default class HttpStatusUnprocessableContent extends HttpError {
  public override get status() {
    return 422
  }
}
