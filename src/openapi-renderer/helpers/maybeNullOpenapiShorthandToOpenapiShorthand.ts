import { OpenapiShorthandPrimitiveBaseTypes, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream/openapi'

export default function maybeNullOpenapiShorthandToOpenapiShorthand(
  openapi: OpenapiShorthandPrimitiveTypes,
): OpenapiShorthandPrimitiveBaseTypes | undefined {
  if (openapi === undefined) return undefined
  if (typeof openapi === 'string') return openapi
  if (!Array.isArray(openapi)) return undefined
  if (openapi.length !== 2) return undefined
  if (openapi[1] === 'null') return openapi[0]
  if (openapi[0] === 'null') return openapi[1]
}
