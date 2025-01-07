import HttpError from './index'

export default class MethodNotAllowed extends HttpError {
  constructor(message: string | undefined) {
    super(405, message)
  }
}
