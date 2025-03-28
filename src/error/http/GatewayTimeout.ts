import HttpError from './index.js'

export default class HttpStatusGatewayTimeout extends HttpError {
  public override get status() {
    return 504
  }
}
