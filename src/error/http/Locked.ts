import HttpError from './index.js'

export default class HttpStatusLocked extends HttpError {
  public get status() {
    return 423
  }
}
