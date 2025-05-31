import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream'
import isObject from '../../helpers/isObject.js'
import SerializerOpenapiRenderer from '../SerializerOpenapiRenderer.js'

export default function allSerializersToRefsInOpenapi(
  openapi: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
): OpenapiSchemaBodyShorthand {
  if (!openapi) return {} as OpenapiSchemaBodyShorthand

  return transformValue(openapi) as OpenapiSchemaBodyShorthand
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformValue(value: any): any {
  if (!value) return value

  // If this is an object with a $serializer property, replace it with $ref
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (value.$serializer) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { $serializer, ...rest } = value
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const openapiRenderer = new SerializerOpenapiRenderer($serializer).serializerRef
    return {
      ...rest,
      ...openapiRenderer,
    }
  } else if (isObject(value)) {
    // Recurse into objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed: any = {}
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const [key, val] of Object.entries(value)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      transformed[key] = transformValue(val)
    }

    return transformed
    //
  } else if (Array.isArray(value)) {
    // Recurse into arrays
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return value.map(val => transformValue(val))
    //
  } else {
    // Return primitive values as-is
    return value
  }
}
