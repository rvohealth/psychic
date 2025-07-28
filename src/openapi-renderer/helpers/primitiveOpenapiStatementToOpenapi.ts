import { OpenapiSchemaBody, OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream'
import openapiShorthandToOpenapi, { OpenapiShorthandToOpenapiOptions } from './openapiShorthandToOpenapi.js'

/**
 * @internal
 *
 * parses a primitive stored type
 */
export default function primitiveOpenapiStatementToOpenapi(
  data: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined,
  options: OpenapiShorthandToOpenapiOptions = {},
): OpenapiSchemaBody {
  return openapiShorthandToOpenapi(data, options)
}
