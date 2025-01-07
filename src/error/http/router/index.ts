import HttpError from '../index'

export default class RouterError extends HttpError {
  public get status() {
    return 500
  }

  constructor(message: string) {
    super(message)
  }

  public get message() {
    return `
      A Router error occured, causing psychic to crash. The message recieved was:
        ${this._message}
    `
  }
}
