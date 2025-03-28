import HttpError from './index.js'

export default class HttpStatusBadGateway extends HttpError {
  public override get status() {
    return 502
  }
}
