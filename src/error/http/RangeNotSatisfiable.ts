import HttpError from './index'

export default class RangeNotSatisfiable extends HttpError {
  public get status() {
    return 416
  }
}
