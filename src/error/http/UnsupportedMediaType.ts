import HttpError from './index.js'

export default class HttpStatusUnsupportedMediaType extends HttpError {
  public get status() {
    return 415
  }
}
