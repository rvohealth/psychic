import { OpenapiSchemaObjectBase } from '@rvoh/dream'
import openapiPageParamProperty from './pageParamOpenapiProperty.js'

/**
 * @internal
 *
 * Used to carefully bind implicit pagination params
 * to the requestBody properties. It will not apply
 * the pagination param unless the provided bodySegment
 * is:
 *
 * a.) falsey (null, undefined, etc...)
 * b.) an openapi object (must have { type: 'object'})
 *
 * If neither of these apply, it will simply return
 * what was given to it, without any modifications
 */
export default function safelyAttachPaginationParamToRequestBodySegment<T>(
  paramName: string,
  bodySegment: T,
): T {
  bodySegment ||= {
    type: 'object',
    properties: {},
  } as T

  if ((bodySegment as OpenapiSchemaObjectBase).type === 'object') {
    ;(bodySegment as OpenapiSchemaObjectBase).properties = {
      ...(bodySegment as OpenapiSchemaObjectBase).properties,
      [paramName]: openapiPageParamProperty(),
    }
  }

  return bodySegment
}
