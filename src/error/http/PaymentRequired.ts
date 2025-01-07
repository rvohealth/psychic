import HttpError from './index'

export default class PaymentRequired extends HttpError {
  constructor(message: string | undefined) {
    super(402, message)
  }
}
