import HttpError from '../index'

export default class RouterError extends HttpError {
  constructor(message: string, httpStatusCode = 500) {
    super(httpStatusCode, message)
  }

  public get message() {
    return `
      A Router error occured, causing psychic to crash. The message recieved was:
        ${this._message}
    `
  }
}
