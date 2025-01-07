import HttpError from './index'

export default class NetworkAuthenticationRequired extends HttpError {
  public get status() {
    return 511
  }
}
