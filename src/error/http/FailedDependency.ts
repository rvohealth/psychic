import HttpError from './index'

export default class HttpStatusFailedDependency extends HttpError {
  public get status() {
    return 424
  }
}
