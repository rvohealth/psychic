import HttpError from './index.js'

export default class HttpStatusUnsupportedMediaType extends HttpError {
  public override get status() {
    return 415
  }
}
