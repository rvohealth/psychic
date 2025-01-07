import HttpError from './index'

export default class TooEarly extends HttpError {
  constructor(message: string | undefined) {
    super(425, message)
  }
}
