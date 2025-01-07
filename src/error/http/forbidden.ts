import HttpError from './index'

export default class Forbidden extends HttpError {
  constructor(message: string | undefined) {
    super(403, message)
  }
}
