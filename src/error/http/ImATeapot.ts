import HttpError from './index'

export default class ImATeapot extends HttpError {
  public get status() {
    return 418
  }
}
