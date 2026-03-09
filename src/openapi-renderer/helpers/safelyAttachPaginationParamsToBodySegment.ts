import { OpenapiSchemaObjectBase } from '@rvoh/dream/openapi'
import paginationPageParamOpenapiProperty from './paginationPageParamOpenapiProperty.js'

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
  return safelyAttachParamToRequestBodySegment(paramName, paginationPageParamOpenapiProperty(), bodySegment)
}

/**
 * @internal
 *
 * Generic version: attaches any OpenAPI property definition to a body segment.
 */
export function safelyAttachParamToRequestBodySegment<T>(
  paramName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  property: any,
  bodySegment: T,
): T {
  bodySegment ||= {
    type: 'object',
    properties: {},
  } as T

  if ((bodySegment as OpenapiSchemaObjectBase).type === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    ;(bodySegment as OpenapiSchemaObjectBase).properties = {
      ...(bodySegment as OpenapiSchemaObjectBase).properties,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [paramName]: property,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  return bodySegment
}
