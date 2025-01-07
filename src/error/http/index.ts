export default class HttpError extends Error {
  public get status(): number {
    throw new Error('Must define status on child class')
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data: any

  protected _message: string | undefined

  /**
   * @params.message - can be either an object, in which case it will
   * be treated as "data" and the message will be blank, or
   * it will be a string, in which case it will be treated
   * as "message", and data will be undefined.
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
  ) {
    super()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.data = typeof message === 'object' ? message : undefined

    this._message = typeof message === 'string' ? message : undefined
  }

  public get message() {
    return this._message || ''
  }
}
