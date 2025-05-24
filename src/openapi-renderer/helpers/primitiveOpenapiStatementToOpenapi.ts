import {
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
  openapiShorthandToOpenapi,
} from '@rvoh/dream'

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
