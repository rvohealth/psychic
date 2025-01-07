import HttpError from './index'

export default class UpgradeRequired extends HttpError {
  public get status() {
    return 426
  }
}
