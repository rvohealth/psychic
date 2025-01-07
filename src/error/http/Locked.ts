import HttpError from './index'

export default class Locked extends HttpError {
  constructor(message: string | undefined) {
    super(423, message)
  }
}
