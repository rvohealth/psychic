import HttpError from './index'

export default class LoopDetected extends HttpError {
  public get status() {
    return 508
  }
}
