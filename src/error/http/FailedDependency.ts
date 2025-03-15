import HttpError from './index.js'

export default class HttpStatusFailedDependency extends HttpError {
  public get status() {
    return 424
  }
}
