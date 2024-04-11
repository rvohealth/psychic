import HttpError from './index'

export default class UnprocessableEntity extends HttpError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(message: string, data: any) {
    super(422, message, data)
  }
}
