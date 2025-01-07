import HttpError from './index'

export default class RequestTimeout extends HttpError {
  constructor(message: string | undefined) {
    super(408, message)
  }
}
