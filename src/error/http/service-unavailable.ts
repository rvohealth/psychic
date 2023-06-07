import HttpError from './index'

export default class ServiceUnavailable extends HttpError {
  constructor(message: string) {
    super(503, message)
  }
}
