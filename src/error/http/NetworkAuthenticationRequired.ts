import HttpError from './index'

export default class NetworkAuthenticationRequired extends HttpError {
  constructor(message: string | undefined) {
    super(511, message)
  }
}
