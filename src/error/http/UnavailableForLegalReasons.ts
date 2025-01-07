import HttpError from './index'

export default class UnavailableForLegalReasons extends HttpError {
  constructor(message: string | undefined) {
    super(451, message)
  }
}
