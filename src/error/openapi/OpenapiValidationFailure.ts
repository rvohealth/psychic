import { OpenapiValidateTarget } from '../../openapi-renderer/defaults.js'

export default class OpenapiValidationFailure extends Error {
  constructor(
    public errors: OpenapiValidationError[],
    public target: OpenapiValidateTarget,
  ) {
    super()
  }
}

export type OpenapiValidationError = {
  instancePath: string
  schemaPath: string
  keyword: string
  message: string
  params?: Record<string, unknown>
}
