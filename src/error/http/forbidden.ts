import HttpError from './index'

export default class Forbidden extends HttpError {
  constructor(message: string) {
    super(403, message)
  }
}
