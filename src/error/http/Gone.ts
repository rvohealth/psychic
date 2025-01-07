import HttpError from './index'

export default class Gone extends HttpError {
  public get status() {
    return 410
  }
}
