import HttpError from './index'

export default class UpgradeRequired extends HttpError {
  constructor(message: string | undefined) {
    super(426, message)
  }
}
