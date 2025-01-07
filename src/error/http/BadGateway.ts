import HttpError from './index'

export default class HttpStatusBadGateway extends HttpError {
  public get status() {
    return 502
  }
}
