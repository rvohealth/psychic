import HttpError from './index'

export default class VariantAlsoNegotiates extends HttpError {
  public get status() {
    return 506
  }
}
