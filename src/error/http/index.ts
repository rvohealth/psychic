export default class HttpError extends Error {
  public get status(): number {
    throw new Error('Must define status on child class')
  }

  /**
   * @params.data - Whatever is passed here will be json
   * stringified and rendered as the response body.
   */
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public data: any = undefined,
  ) {
    super()
  }

  public override get message() {
    return `Http status ${this.status} thrown`
  }
}
