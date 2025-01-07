import HttpError from './index'

export default class BadGateway extends HttpError {
  constructor(message: string | undefined) {
    super(502, message)
  }
}
