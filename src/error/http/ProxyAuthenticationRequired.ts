import HttpError from './index'

export default class ProxyAuthenticationRequired extends HttpError {
  public get status() {
    return 407
  }
}
