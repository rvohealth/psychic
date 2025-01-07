import HttpError from './index'

export default class MisdirectedRequest extends HttpError {
  constructor(message: string | undefined) {
    super(421, message)
  }
}
