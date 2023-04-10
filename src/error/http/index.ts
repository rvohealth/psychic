export default class HttpError extends Error {
  public status: number
  public data: any
  protected _message: string
  constructor(statusCode: number, message: string, data?: any) {
    super()
    this.status = statusCode
    this.data = data
    this._message = message
  }

  public get message() {
    return `
      An Http error with status ${this.status} has been thrown with message:
        ${this._message}
    `
  }
}
