import HttpError from '../index.js'

export default class RouterError extends HttpError {
  public get status() {
    return 500
  }

  protected get messageString(): string {
    throw new Error('Must define messageString in child error class')
  }

  public get message() {
    return `
      A Router error occured, causing psychic to crash. The message recieved was:
        ${this.messageString}
    `
  }
}
