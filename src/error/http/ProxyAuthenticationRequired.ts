import HttpError from './index'

export default class ProxyAuthenticationRequired extends HttpError {
  constructor(message: string | undefined) {
    super(407, message)
  }
}
