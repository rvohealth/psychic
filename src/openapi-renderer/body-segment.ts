/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dream } from '@rvoh/dream'
import { inferSerializerFromDreamOrViewModel, isDreamSerializer } from '@rvoh/dream/internal'
import {
  OpenapiPrimitiveTypes,
  OpenapiSchemaArray,
  OpenapiSchemaBase,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaExpressionRefSchemaShorthand,
  OpenapiSchemaObject,
  OpenapiSchemaObjectBase,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaProperties,
  OpenapiSchemaShorthandExpressionAllOf,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiSchemaShorthandExpressionSerializableRef,
  OpenapiSchemaShorthandExpressionSerializerRef,
  OpenapiShorthandAllTypes,
  OpenapiShorthandPrimitiveTypes,
  openapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { DreamModelSerializerType, SerializerCasing, SimpleObjectSerializerType } from '@rvoh/dream/types'
import NonSerializerSuppliedToSerializerBodySegment from '../error/openapi/NonSerializerSuppliedToSerializerBodySegment.js'
import isArrayParamName from '../helpers/isArrayParamName.js'
import { OpenapiEndpointResponse, OpenapiRenderOpts, OpenapiResponses } from './endpoint.js'
import isBlankDescription from './helpers/isBlankDescription.js'
import maybeNullOpenapiShorthandToOpenapiShorthand from './helpers/maybeNullOpenapiShorthandToOpenapiShorthand.js'
import primitiveOpenapiStatementToOpenapi from './helpers/primitiveOpenapiStatementToOpenapi.js'
import schemaToRef from './helpers/schemaToRef.js'
import SerializerOpenapiRenderer from './SerializerOpenapiRenderer.js'

export interface OpenapiBodySegmentRendererOpts {
  renderOpts: OpenapiRenderOpts
  target: OpenapiBodyTarget
}

/**
 * @internal
 *
 * Internal class used to recursively expand OpenAPI shorthand notation into full OpenAPI schema objects.
 *
 * This class handles the transformation of various shorthand formats:
 * - Primitive shorthands like `'string'` → `{ type: 'string' }`
 * - Nullable shorthands like `['string', 'null']` → `{ type: ['string', 'null'] }`
 * - Array shorthands like `'string[]'` → `{ type: 'array', items: { type: 'string' } }`
 * - Nullable array shorthands like `['string[]', 'null']` → `{ type: ['array', 'null'], items: { type: 'string' } }`
 * - Serializer references like `{ $serializer: SomeSerializer }` → `{ $ref: '#/components/schemas/SerializerOpenapiName' }`
 * - Serializable references like `{ $serializable: SomeModel, key: 'summary' }` → resolved serializer reference
 *
 * The class recursively processes nested structures (objects, arrays, unions) and maintains
 * a collection of referenced serializers that need to be included in the final OpenAPI document.
 *
 * @example
 * ```typescript
 * // Input shorthand
 * {
 *   type: 'object',
 *   properties: {
 *     name: 'string',
 *     tags: 'string[]',
 *     user: { $serializer: UserSerializer }
 *   }
 * }
 *
 * // Output expanded
 * {
 *   type: 'object',
 *   properties: {
 *     name: { type: 'string' },
 *     tags: { type: 'array', items: { type: 'string' } },
 *     user: { $ref: '#/components/schemas/UserSerializer' }
 *   }
 * }
 * ```
 */
export default class OpenapiSegmentExpander {
  private bodySegment: OpenapiBodySegment
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private target: OpenapiBodyTarget

  /**
   * @internal
   *
   * Used to recursively expand nested object structures
   * within nested openapi objects
   */
  constructor(bodySegment: OpenapiBodySegment, { renderOpts, target }: OpenapiBodySegmentRendererOpts) {
    this.bodySegment = bodySegment
    this.casing = renderOpts.casing
    this.suppressResponseEnums = renderOpts.suppressResponseEnums
    this.target = target
  }

  /**
   * returns the shorthanded body segment, rendered
   * to the appropriate openapi shape
   */
  public render(): ReferencedSerializersAndOpenapiSchemaBody {
    return this.recursivelyParseBody(this.bodySegment)
  }

  /**
   * @internal
   *
   * Recursively expand nested objects and arrays,
   * as well as primitive types
   */
  public recursivelyParseBody(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    switch (this.segmentType(bodySegment)) {
      case 'blank_description':
        return {
          referencedSerializers: [],
          openapi: bodySegment as OpenapiSchemaBody,
        }

      case 'oneOf':
        return this.oneOfStatement(bodySegment)

      case 'anyOf':
        return this.anyOfStatement(bodySegment)

      case 'allOf':
        return this.allOfStatement(bodySegment)

      case 'object':
        return this.objectStatement(bodySegment as OpenapiSchemaObject)

      case 'array':
        return this.arrayStatement(bodySegment as OpenapiSchemaArray)

      case 'openapi_primitive_literal':
        return {
          referencedSerializers: [],
          openapi: this.primitiveLiteralStatement(bodySegment as OpenapiShorthandPrimitiveTypes),
        }

      case 'openapi_primitive_object':
        return {
          referencedSerializers: [],
          openapi: this.primitiveObjectStatement(bodySegment as OpenapiShorthandPrimitiveTypes),
        }

      case '$ref':
        return {
          referencedSerializers: [],
          openapi: this.refStatement(bodySegment),
        }

      case '$schema':
        return {
          referencedSerializers: [],
          openapi: schemaToRef(bodySegment),
        }

      case '$serializer':
        return this.serializerStatement(bodySegment)

      case '$serializable':
        return this.serializableStatement(bodySegment)

      case 'unknown_object':
        return {
          referencedSerializers: [],
          openapi: this.unknownObjectStatement(bodySegment),
        }

      case undefined:
        return {
          referencedSerializers: [],
          openapi: { type: 'object' },
        }
    }
  }

  /**
   * @internal
   *
   * Returns a type based on analysis of the bodySegment
   */
  private segmentType(bodySegment: OpenapiBodySegment) {
    if (bodySegment === undefined) return undefined

    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const allOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAllOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand
    const serializerRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializerRef
    const serializableRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializableRef

    if (isBlankDescription(bodySegment)) return 'blank_description'
    if (typeof serializerRefBodySegment.$serializer === 'function') return '$serializer'
    if (serializableRefBodySegment.$serializable) return '$serializable'
    if (refBodySegment.$ref) return '$ref'
    if (schemaRefBodySegment.$schema) return '$schema'
    if (oneOfBodySegment.oneOf) return 'oneOf'
    if (anyOfBodySegment.anyOf) return 'anyOf'
    if (allOfBodySegment.allOf) return 'allOf'
    if (this.maybeNullTypeToType(objectBodySegment) === 'object') return 'object'
    else if (this.maybeNullTypeToType(arrayBodySegment) === 'array') return 'array'
    else {
      const primitiveString = maybeNullOpenapiShorthandToOpenapiShorthand(
        bodySegment as OpenapiPrimitiveTypes,
      )
      if (typeof primitiveString === 'string' && openapiShorthandPrimitiveTypes.includes(primitiveString))
        return 'openapi_primitive_literal'

      if (typeof bodySegment === 'object') {
        if (
          openapiShorthandPrimitiveTypes.includes(
            this.maybeNullTypeToType(bodySegment) as (typeof openapiShorthandPrimitiveTypes)[number],
          )
        )
          return 'openapi_primitive_object'
      }

      if (typeof bodySegment === 'object') return 'unknown_object'
    }
  }

  private maybeNullTypeToType(bodySegment: OpenapiBodySegment | OpenapiSchemaObject | OpenapiSchemaArray) {
    if (bodySegment === undefined) return undefined
    if (typeof bodySegment === 'string') return bodySegment

    const safeBodySegment = bodySegment as { type: OpenapiShorthandAllTypes }
    const openapiType = safeBodySegment.type

    if (Array.isArray(openapiType)) {
      if (openapiType[1] === 'null') return openapiType[0]
      if (openapiType[0] === 'null') return openapiType[1]
      return undefined
    } else {
      return openapiType
    }
  }

  /**
   * @internal
   *
   * recursively expands a oneOf statement
   */
  private oneOfStatement(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf

    const referencedSerializersAndOneOfArray = oneOfBodySegment.oneOf.reduce(
      (
        acc: {
          referencedSerializers: SerializerArray
          oneOf: OpenapiSchemaBody[]
        },
        segment,
      ) => {
        const results = this.recursivelyParseBody(segment as OpenapiBodySegment)
        acc.referencedSerializers = [...acc.referencedSerializers, ...results.referencedSerializers]
        const openapi: OpenapiSchemaBody = results.openapi
        acc.oneOf = [...acc.oneOf, openapi]
        return acc
      },
      {
        referencedSerializers: [],
        oneOf: [],
      },
    )

    return {
      referencedSerializers: referencedSerializersAndOneOfArray.referencedSerializers,
      openapi: {
        oneOf: referencedSerializersAndOneOfArray.oneOf,
      },
    }
  }

  /**
   * @internal
   *
   * recursively expand an anyOf statement
   */
  private anyOfStatement(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf

    const referencedSerializersAndOneOfArray = anyOfBodySegment.anyOf.reduce(
      (
        acc: {
          referencedSerializers: SerializerArray
          anyOf: OpenapiSchemaBody[]
        },
        segment,
      ) => {
        const results = this.recursivelyParseBody(segment as OpenapiBodySegment)
        acc.referencedSerializers = [...acc.referencedSerializers, ...results.referencedSerializers]
        const openapi: OpenapiSchemaBody = results.openapi
        acc.anyOf = [...acc.anyOf, openapi]
        return acc
      },
      {
        referencedSerializers: [],
        anyOf: [],
      },
    )

    return {
      referencedSerializers: referencedSerializersAndOneOfArray.referencedSerializers,
      openapi: {
        anyOf: referencedSerializersAndOneOfArray.anyOf,
      },
    }
  }

  /**
   * @internal
   *
   * recursively expand an allOf statement
   */
  private allOfStatement(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    const allOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAllOf

    const referencedSerializersAndOneOfArray = allOfBodySegment.allOf.reduce(
      (
        acc: {
          referencedSerializers: SerializerArray
          allOf: OpenapiSchemaBody[]
        },
        segment,
      ) => {
        const results = this.recursivelyParseBody(segment as OpenapiBodySegment)
        acc.referencedSerializers = [...acc.referencedSerializers, ...results.referencedSerializers]
        const openapi: OpenapiSchemaBody = results.openapi
        acc.allOf = [...acc.allOf, openapi]
        return acc
      },
      {
        referencedSerializers: [],
        allOf: [],
      },
    )

    return {
      referencedSerializers: referencedSerializersAndOneOfArray.referencedSerializers,
      openapi: {
        allOf: referencedSerializersAndOneOfArray.allOf,
      },
    }
  }

  /**
   * @internal
   *
   * recursively expand an array statement
   */
  private arrayStatement(bodySegment: OpenapiSchemaArray): ReferencedSerializersAndOpenapiSchemaBody {
    const results = this.recursivelyParseBody(bodySegment.items)

    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: bodySegment.type,
      items: results.openapi,
    })

    const description = bodySegment.description

    if (description) {
      data.description = description
    }

    return { ...results, openapi: data }
  }

  /**
   * @internal
   *
   * recursively expand an object statement
   */
  private objectStatement(bodySegment: OpenapiSchemaObject): ReferencedSerializersAndOpenapiSchemaBody {
    const objectBodySegment = bodySegment as OpenapiSchemaObjectBase
    const data: OpenapiSchemaObjectBase = {
      type: bodySegment.type,
    }

    if (objectBodySegment.description) {
      data.description = objectBodySegment.description
    }

    if (objectBodySegment.summary) {
      data.summary = objectBodySegment.summary
    }

    if (objectBodySegment.maxProperties) {
      data.maxProperties = objectBodySegment.maxProperties
    }

    if (objectBodySegment.minProperties) {
      data.minProperties = objectBodySegment.minProperties
    }

    let referencedSerializers: SerializerArray = []

    if (objectBodySegment.additionalProperties) {
      const results = this.recursivelyParseBody(objectBodySegment.additionalProperties)
      referencedSerializers = [...referencedSerializers, ...results.referencedSerializers]
      data.additionalProperties = results.openapi as OpenapiSchemaObject
    }

    if (Array.isArray(objectBodySegment.required)) data.required = objectBodySegment.required

    if (objectBodySegment.properties) {
      const results = this.parseObjectPropertyStatement(objectBodySegment.properties)
      referencedSerializers = [...referencedSerializers, ...results.referencedSerializers]
      data.properties = results.openapi as unknown as OpenapiSchemaProperties
    }

    return { referencedSerializers, openapi: data }
  }

  /**
   * @internal
   *
   * expand either the `properties` or `additionalProperties` values
   * on an object
   */
  private parseObjectPropertyStatement(
    propertySegment:
      | Record<string, OpenapiSchemaBody | OpenapiSchemaBodyShorthand>
      | OpenapiSchemaExpressionAllOf
      | OpenapiSchemaExpressionAnyOf
      | OpenapiSchemaExpressionOneOf
      | OpenapiSchemaShorthandExpressionAllOf
      | OpenapiSchemaShorthandExpressionAnyOf
      | OpenapiSchemaShorthandExpressionOneOf,
  ): ReferencedSerializersAndOpenapiSchemaBody {
    if (
      (propertySegment as OpenapiSchemaExpressionOneOf).oneOf ||
      (propertySegment as OpenapiSchemaExpressionAllOf).allOf ||
      (propertySegment as OpenapiSchemaExpressionAnyOf).anyOf
    ) {
      return this.recursivelyParseBody(propertySegment as OpenapiBodySegment)
    }

    let referencedSerializers: SerializerArray = []
    const objectBodySegment = propertySegment as unknown as OpenapiSchemaObjectBase

    Object.keys(objectBodySegment || {}).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      const results = this.recursivelyParseBody((objectBodySegment as any)[key])
      referencedSerializers = [...referencedSerializers, ...results.referencedSerializers]
      ;(propertySegment as Record<string, OpenapiSchemaBody | OpenapiSchemaBodyShorthand>)[key] =
        results.openapi
    })

    return { referencedSerializers, openapi: propertySegment as OpenapiSchemaBody }
  }

  /**
   * @internal
   *
   * recursively expand a primitive literal type (i.e. string or boolean[])
   */
  private primitiveLiteralStatement(
    bodySegment: OpenapiShorthandPrimitiveTypes,
  ): OpenapiSchemaPrimitiveGeneric {
    return primitiveOpenapiStatementToOpenapi(bodySegment) as OpenapiSchemaPrimitiveGeneric
  }

  /**
   * @internal
   *
   * recursively expand a primitive object type (i.e. { type: 'string[]' })
   */
  private primitiveObjectStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaPrimitiveGeneric {
    const safeBodySegment = bodySegment as Extract<OpenapiSchemaBase, { type: OpenapiPrimitiveTypes }>

    if (this.typeIsOpenapiArrayPrimitive(safeBodySegment.type)) {
      return this.applyConfigurationOptions(
        this.applyCommonFieldsToPayload<OpenapiSchemaPrimitiveGeneric>({
          ...safeBodySegment,
          ...primitiveOpenapiStatementToOpenapi(safeBodySegment.type),
        } as OpenapiSchemaPrimitiveGeneric),
      )
    } else {
      return this.applyConfigurationOptions(
        this.applyCommonFieldsToPayload<OpenapiSchemaPrimitiveGeneric>({
          ...safeBodySegment,
          ...primitiveOpenapiStatementToOpenapi(safeBodySegment.type),
        } as OpenapiSchemaPrimitiveGeneric),
      )
    }
  }

  private typeIsOpenapiArrayPrimitive(openapiType: OpenapiPrimitiveTypes): boolean {
    return isArrayParamName(maybeNullOpenapiShorthandToOpenapiShorthand(openapiType))
  }

  private applyConfigurationOptions<T>(obj: T): T {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const anyObj = obj as any

    if (typeof anyObj === 'object') {
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        anyObj?.type === 'string' &&
        this.target === 'response' &&
        this.suppressResponseEnums
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const enums = anyObj.enum as string[] | null

        if (enums?.length) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          delete anyObj.enum

          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          anyObj.description ||= `
The following values will be allowed:
  ${enums.join(',\n  ')}`
        }
      }
    }

    return anyObj as T
  }

  /**
   * @internal
   *
   * recursively a $ref statement
   */
  private refStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionRef {
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    return {
      $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
    }
  }

  /**
   * @internal
   *
   * recursively a $ref statement
   */
  private serializerStatement(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    const serializerRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializerRef
    const serializer = serializerRefBodySegment.$serializer

    if (!isDreamSerializer(serializer))
      throw new NonSerializerSuppliedToSerializerBodySegment(this.bodySegment, serializer)

    const serializerRef = new SerializerOpenapiRenderer(serializer, {
      casing: this.casing,
      suppressResponseEnums: this.suppressResponseEnums,
    }).serializerRef

    if (serializerRefBodySegment.many) {
      const returnVal = {
        type: serializerRefBodySegment.maybeNull ? ['array', 'null'] : 'array',
        items: serializerRef,
      } as OpenapiSchemaArray

      return {
        referencedSerializers: [serializer],
        openapi: returnVal,
      }
    }

    if (serializerRefBodySegment.maybeNull) {
      return {
        referencedSerializers: [serializer],
        openapi: {
          allOf: [serializerRef, { type: 'null' }],
        },
      }
    }

    return { referencedSerializers: [serializer], openapi: serializerRef }
  }

  private serializableStatement(bodySegment: OpenapiBodySegment): ReferencedSerializersAndOpenapiSchemaBody {
    const serializableRef = bodySegment as OpenapiSchemaShorthandExpressionSerializableRef
    const key = serializableRef.key || 'default'
    const serializer = inferSerializerFromDreamOrViewModel(
      serializableRef.$serializable.prototype as Dream,
      key,
    )

    if (!serializer)
      throw new Error(
        `Failed to locate serializers getter from: ${serializableRef.$serializable.name} using key: ${key}`,
      )

    return this.serializerStatement({
      $serializer: serializer,
      ...serializableRef,
    })
  }

  /**
   * @internal
   *
   * recursively an unknown_object statement
   */
  private unknownObjectStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaBody {
    return this.applyCommonFieldsToPayload(bodySegment as any) as OpenapiSchemaBody
  }

  /**
   * @internal
   *
   * binds shared openapi fields to any object
   */
  private applyCommonFieldsToPayload<
    Obj extends OpenapiSchemaBody | OpenapiSchemaObject | OpenapiSchemaArray,
  >(obj: Obj): Obj {
    const objectCast = obj as OpenapiSchemaObject
    const returnObj: Obj = {
      ...obj,
    }

    if (objectCast.description) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(returnObj as any).description = objectCast.description
    }

    if (objectCast.summary) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ;(returnObj as any).summary = objectCast.summary
    }

    return returnObj
  }
}

export type OpenapiBodySegment =
  | OpenapiSchemaBodyShorthand
  | OpenapiShorthandPrimitiveTypes
  | { description: string }
  | undefined

export type OpenapiBodyTarget = 'request' | 'response'

export type SerializerArray = (DreamModelSerializerType | SimpleObjectSerializerType)[]

export interface ReferencedSerializersAndOpenapiSchemaBody {
  referencedSerializers: SerializerArray
  openapi: OpenapiSchemaBody
}

export interface ReferencedSerializersAndOpenapiResponses {
  referencedSerializers: SerializerArray
  openapi: OpenapiResponses
}

export interface ReferencedSerializersAndOpenapiEndpointResponse {
  referencedSerializers: SerializerArray
  openapi: OpenapiEndpointResponse
}
