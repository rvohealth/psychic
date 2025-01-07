import HttpError from './index'

export default class NotFound extends HttpError {
  constructor(message: string | undefined) {
    super(404, message)
  }
}
