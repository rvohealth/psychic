import HttpError from './index'

export default class BadGateway extends HttpError {
  public get status() {
    return 502
  }
}
