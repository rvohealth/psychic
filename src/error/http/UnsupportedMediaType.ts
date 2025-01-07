import HttpError from './index'

export default class UnsupportedMediaType extends HttpError {
  public get status() {
    return 415
  }
}
