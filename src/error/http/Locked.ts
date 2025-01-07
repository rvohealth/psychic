import HttpError from './index'

export default class HttpStatusLocked extends HttpError {
  public get status() {
    return 423
  }
}
