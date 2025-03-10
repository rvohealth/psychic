import HttpError from './index.js'

export default class HttpStatusProxyAuthenticationRequired extends HttpError {
  public get status() {
    return 407
  }
}
