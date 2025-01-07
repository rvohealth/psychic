import HttpError from './index'

export default class HttpVersionNotSupported extends HttpError {
  constructor(message: string | undefined) {
    super(505, message)
  }
}
