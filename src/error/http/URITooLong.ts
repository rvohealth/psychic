import HttpError from './index'

export default class URITooLong extends HttpError {
  public get status() {
    return 414
  }
}
