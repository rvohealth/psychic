import HttpError from './index.js'

export default class HttpStatusLocked extends HttpError {
  public override get status() {
    return 423
  }
}
