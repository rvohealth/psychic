import HttpError from './index.js'

export default class HttpStatusGatewayTimeout extends HttpError {
  public get status() {
    return 504
  }
}
