import HttpError from './index'

export default class LoopDetected extends HttpError {
  constructor(message: string | undefined) {
    super(508, message)
  }
}
