import HttpError from './index'

export default class NotAcceptable extends HttpError {
  constructor(message: string | undefined) {
    super(406, message)
  }
}
