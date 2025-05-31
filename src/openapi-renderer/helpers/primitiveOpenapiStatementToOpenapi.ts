import { OpenapiSchemaBody, OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream'
import openapiShorthandToOpenapi from './openapiShorthandToOpenapi.js'

/**
 * @internal
 *
 * parses a primitive stored type
 */
export default function primitiveOpenapiStatementToOpenapi(
  data: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined,
  maybeNull: boolean = false,
): OpenapiSchemaBody {
  return openapiShorthandToOpenapi(data, { maybeNull })
}
