import HttpError from './index'

export default class UnsupportedMediaType extends HttpError {
  constructor(message: string | undefined) {
    super(415, message)
  }
}
