import { openapiShorthandPrimitiveTypes } from '@rvoh/dream'
import maybeNullOpenapiShorthandToOpenapiShorthand from './maybeNullOpenapiShorthandToOpenapiShorthand.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function isOpenapiShorthand(openapi: any): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const openapiShorthand = maybeNullOpenapiShorthandToOpenapiShorthand(openapi)
  if (typeof openapiShorthand !== 'string') return false
  return openapiShorthandPrimitiveTypes.includes(openapiShorthand)
}
