import HttpError from './index'

export default class Locked extends HttpError {
  public get status() {
    return 423
  }
}
