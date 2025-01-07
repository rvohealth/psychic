import HttpError from './index'

export default class PaymentRequired extends HttpError {
  public get status() {
    return 402
  }
}
