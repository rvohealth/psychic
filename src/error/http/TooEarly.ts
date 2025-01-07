import HttpError from './index'

export default class TooEarly extends HttpError {
  public get status() {
    return 425
  }
}
