import HttpError from './index'

export default class VariantAlsoNegotiates extends HttpError {
  constructor(message: string | undefined) {
    super(506, message)
  }
}
