import HttpError from './index'

export default class RangeNotSatisfiable extends HttpError {
  constructor(message: string | undefined) {
    super(416, message)
  }
}
