import HttpError from './index'

export default class LengthRequired extends HttpError {
  constructor(message: string | undefined) {
    super(411, message)
  }
}
