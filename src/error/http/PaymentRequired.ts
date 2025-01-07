import HttpError from './index'

export default class HttpStatusPaymentRequired extends HttpError {
  public get status() {
    return 402
  }
}
