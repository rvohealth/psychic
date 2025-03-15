import HttpError from './index.js.js'

export default class HttpStatusBadGateway extends HttpError {
  public get status() {
    return 502
  }
}
