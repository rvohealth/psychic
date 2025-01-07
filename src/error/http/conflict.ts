import HttpError from './index'

export default class Conflict extends HttpError {
  constructor(message: string | undefined) {
    super(409, message)
  }
}
