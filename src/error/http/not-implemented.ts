import HttpError from './index'

export default class NotImplemented extends HttpError {
  constructor(message: string | undefined) {
    super(501, message)
  }
}
