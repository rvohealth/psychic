export default class HttpError extends Error {
  public status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any
  protected _message: string | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(statusCode: number, message: string | undefined, data?: any) {
    super()
    this.status = statusCode
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.data = data
    this._message = message
  }

  public get message() {
    return this._message || ''
  }
}
