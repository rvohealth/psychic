import HttpError from './index'

export default class InternalServerError extends HttpError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, data: any) {
    super(500, message, data)
  }
}
