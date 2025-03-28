import HttpError from './index.js'

export default class HttpStatusProxyAuthenticationRequired extends HttpError {
  public override get status() {
    return 407
  }
}
