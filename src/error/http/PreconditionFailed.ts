import HttpError from './index'

export default class PreconditionFailed extends HttpError {
  constructor(message: string | undefined) {
    super(412, message)
  }
}
