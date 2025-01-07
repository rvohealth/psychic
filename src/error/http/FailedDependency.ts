import HttpError from './index'

export default class FailedDependency extends HttpError {
  public get status() {
    return 424
  }
}
