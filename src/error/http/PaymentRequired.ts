import HttpError from './index.js.js'

export default class HttpStatusPaymentRequired extends HttpError {
  public get status() {
    return 402
  }
}
