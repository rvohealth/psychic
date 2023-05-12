import HttpError from './index'

export default class NotImplemented extends HttpError {
  constructor(message: string, data: any) {
    super(501, message, data)
  }
}
