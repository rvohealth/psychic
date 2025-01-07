import HttpError from './index'

export default class URITooLong extends HttpError {
  constructor(message: string | undefined) {
    super(414, message)
  }
}
