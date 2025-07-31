export default class OpenapiValidationFailure extends Error {
  constructor(public errors: OpenapiValidationError[]) {
    super()
  }

  public get errorsJson() {
    return this.errors.reduce(
      (agg, error) => {
        agg[error.instancePath.replace(/^\//, '')] = [error.message]
        return agg
      },
      {} as Record<string, unknown>,
    )
  }

  public override get message() {
    return ``
  }
}

export type OpenapiValidationError = {
  instancePath: string
  schemaPath: string
  keyword: string
  message: string
  params?: Record<string, unknown>
}
