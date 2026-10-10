/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { OpenapiSchemaBodyShorthand, OpenapiShorthandPrimitiveTypes } from '@rvoh/dream/openapi'
import isObject from '../../helpers/isObject.js'
import SerializerOpenapiRenderer from '../SerializerOpenapiRenderer.js'
import serializerRefsToOpenapi from './serializerRefsToOpenapi.js'
import serializersAndRefsFromSerializableRef from './serializersAndRefsFromSerializableRef.js'

/**
 * @internal
 *
 * Transforms OpenAPI schema definitions by replacing serializer shorthand references with proper `$ref` statements.
 *
 * This function is used by the SerializerOpenapiRenderer to ensure that the schemas it generates from
 * Serializers contain `$ref` statements instead of `$serializer` or `$serializable` statements. This
 * transformation enables consistent ordering of `anyOf` statements since `anyOf` arrays are sorted by
 * the `$ref` value, which follows the pattern `'#/components/schemas/TheSerializerOpenapiName'`.
 *
 * The function recursively traverses the schema and transforms:
 * - `{ $serializer: SomeSerializer }` → `{ $ref: '#/components/schemas/SerializerOpenapiName' }`
 * - `{ $serializable: SomeModel, key: 'summary' }` → `{ $ref: '#/components/schemas/ModelSummarySerializer' }`
 * - `many` and `maybeNull` beside either into an array of the ref and/or a nullable ref
 *   (see `serializerRefsToOpenapi`)
 *
 * @param openapi - The OpenAPI schema definition that may contain serializer shorthand references
 * @returns The transformed schema with `$ref` statements replacing serializer shorthands
 *
 * @example
 * ```typescript
 * const input = {
 *   type: 'object',
 *   properties: {
 *     user: { $serializer: UserSerializer },
 *     posts: {
 *       type: 'array',
 *       items: { $serializer: PostSerializer }
 *     }
 *   }
 * }
 *
 * const output = allSerializersToRefsInOpenapi(input)
 * // Returns:
 * // {
 * //   type: 'object',
 * //   properties: {
 * //     user: { $ref: '#/components/schemas/UserSerializer' },
 * //     posts: {
 * //       type: 'array',
 * //       items: { $ref: '#/components/schemas/PostSerializer' }
 * //     }
 * //   }
 * // }
 * ```
 */
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
  if (value.$serializer) {
    const { $serializer, many, maybeNull, ...rest } = value
    const serializerRef = new SerializerOpenapiRenderer($serializer).serializerRef
    return {
      ...rest,
      ...serializerRefsToOpenapi([serializerRef], { many, maybeNull }),
    }
    //
  } else if (value.$serializable) {
    const { $serializable, $serializableSerializerKey, key, ...rest } = value
    const { refs } = serializersAndRefsFromSerializableRef({ $serializable, $serializableSerializerKey, key })

    if (refs.length === 0) return rest

    const { many, maybeNull, ...restWithoutManyAndMaybeNull } = rest
    return {
      ...restWithoutManyAndMaybeNull,
      ...serializerRefsToOpenapi(refs, { many, maybeNull }),
    }

    //
  } else if (isObject(value)) {
    // Recurse into objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformed: any = {}
    for (const [key, val] of Object.entries(value)) {
      transformed[key] = transformValue(val)
    }

    return transformed
    //
  } else if (Array.isArray(value)) {
    // Recurse into arrays
    return value.map(val => transformValue(val))
    //
  } else {
    // Return primitive values as-is
    return value
  }
}
