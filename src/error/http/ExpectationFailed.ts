import HttpError from './index'

export default class ExpectationFailed extends HttpError {
  constructor(message: string | undefined) {
    super(417, message)
  }
}
