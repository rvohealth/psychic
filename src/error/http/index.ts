export default class HttpError extends Error {
  public status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any
  protected _message: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(statusCode: number, message: string, data?: any) {
    super()
    this.status = statusCode
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
