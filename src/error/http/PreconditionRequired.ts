import HttpError from './index'

export default class PreconditionRequired extends HttpError {
  constructor(message: string | undefined) {
    super(428, message)
  }
}
