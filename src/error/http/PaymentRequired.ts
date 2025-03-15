import HttpError from './index.js'

export default class HttpStatusPaymentRequired extends HttpError {
  public get status() {
    return 402
  }
}
