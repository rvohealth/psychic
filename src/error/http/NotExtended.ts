import HttpError from './index'

export default class NotExtended extends HttpError {
  constructor(message: string | undefined) {
    super(510, message)
  }
}
