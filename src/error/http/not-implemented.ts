import HttpError from './index'

export default class NotImplemented extends HttpError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, data: any) {
    super(501, message, data)
  }
}
