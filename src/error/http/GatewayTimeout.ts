import HttpError from './index'

export default class GatewayTimeout extends HttpError {
  public get status() {
    return 504
  }
}
