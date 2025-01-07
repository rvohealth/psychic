import HttpError from './index'

export default class InsufficientStorage extends HttpError {
  constructor(message: string | undefined) {
    super(507, message)
  }
}
