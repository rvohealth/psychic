import HttpError from './index'

export default class ImATeapot extends HttpError {
  constructor(message: string | undefined) {
    super(418, message)
  }
}
