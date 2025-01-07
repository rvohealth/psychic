import HttpError from './index'

export default class RequestHeaderFieldsTooLarge extends HttpError {
  constructor(message: string | undefined) {
    super(431, message)
  }
}
