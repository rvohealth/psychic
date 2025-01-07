import HttpError from './index'

export default class LengthRequired extends HttpError {
  public get status() {
    return 411
  }
}
