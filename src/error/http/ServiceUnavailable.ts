import HttpError from './index'

export default class ServiceUnavailable extends HttpError {
  public get status() {
    return 503
  }
}
