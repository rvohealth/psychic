import HttpError from './index'

export default class MisdirectedRequest extends HttpError {
  public get status() {
    return 421
  }
}
