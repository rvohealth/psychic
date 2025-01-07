import HttpError from './index'

export default class HttpStatusGatewayTimeout extends HttpError {
  public get status() {
    return 504
  }
}
