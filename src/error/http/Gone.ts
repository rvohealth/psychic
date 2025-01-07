import HttpError from './index'

export default class Gone extends HttpError {
  constructor(message: string | undefined) {
    super(410, message)
  }
}
