import HttpError from './index'

export default class NotImplemented extends HttpError {
  public get status() {
    return 501
  }
}
