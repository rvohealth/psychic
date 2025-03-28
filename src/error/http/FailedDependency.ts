import HttpError from './index.js'

export default class HttpStatusFailedDependency extends HttpError {
  public override get status() {
    return 424
  }
}
