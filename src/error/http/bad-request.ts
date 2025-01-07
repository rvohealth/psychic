import HttpError from './index'

export default class BadRequest extends HttpError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(data: any) {
    super(400, undefined, data)
  }
}
