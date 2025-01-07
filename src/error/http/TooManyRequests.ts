import HttpError from './index'

export default class TooManyRequests extends HttpError {
  constructor(message: string | undefined) {
    super(429, message)
  }
}
