import HttpError from './index.js'

export default class HttpStatusPaymentRequired extends HttpError {
  public override get status() {
    return 402
  }
}
