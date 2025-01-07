import HttpError from './index'

export default class PayloadTooLarge extends HttpError {
  constructor(message: string | undefined) {
    super(413, message)
  }
}
