import HttpError from './index'

export default class GatewayTimeout extends HttpError {
  constructor(message: string | undefined) {
    super(504, message)
  }
}
