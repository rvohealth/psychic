export default class DBError extends Error {
  private _message: string
  constructor(message: string) {
    super()
    this._message = message
  }

  public get message() {
    return `
      A Database error occured, causing howl to crash. The message recieved was:
        ${this._message}
    `
  }
}
