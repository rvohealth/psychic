export default class HttpError extends Error {
  public get status(): number {
    throw new Error('Must define status on child class')
  }

  /**
   * @params.data - Whatever is passed here will be json
   * stringified and rendered as the response body when psychic answers the
   * error with its status as a handled response: the 4xx classes, and the
   * 5xx classes other than `HttpStatusInternalServerError`. That includes a
   * string, `0`, `false` and `''`, whether the error is thrown from a
   * controller action or from middleware. Without data, or with `null`, the
   * error is answered with its status and an empty body. An error psychic
   * answers as a server error, such as `HttpStatusInternalServerError`, has
   * its data logged but never sent to the client.
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
