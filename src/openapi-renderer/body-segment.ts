/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Dream,
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
  SerializerCasing,
  SerializerOpenapiRenderer,
  inferSerializerFromDreamOrViewModel,
  maybeNullOpenapiShorthandToOpenapiShorthand,
  openapiShorthandPrimitiveTypes,
} from '@rvoh/dream'
import isArrayParamName from '../helpers/isArrayParamName.js'
import isBlankDescription from './helpers/isBlankDescription.js'
import primitiveOpenapiStatementToOpenapi from './helpers/primitiveOpenapiStatementToOpenapi.js'
import schemaToRef from './helpers/schemaToRef.js'
import suppressResponseEnums from './helpers/suppressResponseEnums.js'

export default class OpenapiBodySegmentRenderer {
  private bodySegment: OpenapiBodySegment
  private schemaDelimeter: string
  private casing: SerializerCasing
  private suppressResponseEnums: boolean
  private computedExtraComponents: { [key: string]: OpenapiSchemaObject } = {}
  private target: OpenapiBodyTarget
  private openapiName: string

  /**
   * @internal
   *
   * Used to recursively parse nested object structures
   * within nested openapi objects
   */
  constructor({
    openapiName,
    bodySegment,
    schemaDelimeter,
    casing,
    suppressResponseEnums,
    target,
  }: {
    openapiName: string
    bodySegment: OpenapiBodySegment
    schemaDelimeter: string
    casing: SerializerCasing
    suppressResponseEnums: boolean
    target: OpenapiBodyTarget
  }) {
    this.openapiName = openapiName
    this.bodySegment = bodySegment
    this.schemaDelimeter = schemaDelimeter
    this.casing = casing
    this.suppressResponseEnums = suppressResponseEnums
    this.target = target
  }

  /**
   * returns the shorthanded body segment, rendered
   * to the appropriate openapi shape
   */
  public render(): OpenapiSchemaBody {
    return this.recursivelyParseBody(this.bodySegment)
  }

  /**
   * @internal
   *
   * Recursively parses nested objects and arrays,
   * as well as primitive types
   */
  public recursivelyParseBody(bodySegment: OpenapiBodySegment): OpenapiSchemaBody {
    switch (this.segmentType(bodySegment)) {
      case 'blank_description':
        return bodySegment as OpenapiSchemaBody

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
        return this.primitiveLiteralStatement(bodySegment as OpenapiShorthandPrimitiveTypes)

      case 'openapi_primitive_object':
        return this.primitiveObjectStatement(bodySegment as OpenapiShorthandPrimitiveTypes)

      case '$ref':
        return this.refStatement(bodySegment)

      case '$schema':
        return schemaToRef(bodySegment)

      case '$serializer':
        return this.serializerStatement(bodySegment)

      case '$serializable':
        return this.serializableStatement(bodySegment)

      case 'unknown_object':
        return this.unknownObjectStatement(bodySegment)

      case undefined:
        return { type: 'object' }
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
   * recursively parses a oneOf statement
   */
  private oneOfStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionOneOf {
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    return {
      oneOf: oneOfBodySegment.oneOf.map(segment => this.recursivelyParseBody(segment as OpenapiBodySegment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an anyOf statement
   */
  private anyOfStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionAnyOf {
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    return {
      anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment as OpenapiBodySegment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an allOf statement
   */
  private allOfStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionAllOf {
    const allOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAllOf
    return {
      allOf: allOfBodySegment.allOf.map(segment => this.recursivelyParseBody(segment as OpenapiBodySegment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an array statement
   */
  private arrayStatement(bodySegment: OpenapiSchemaArray): OpenapiSchemaArray {
    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: bodySegment.type,
      items: this.recursivelyParseBody(bodySegment.items),
    })

    const description = bodySegment.description

    if (description) {
      data.description = description
    }

    return data
  }

  /**
   * @internal
   *
   * recursively parses an object statement
   */
  private objectStatement(bodySegment: OpenapiSchemaObject): OpenapiSchemaObject {
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

    if (objectBodySegment.additionalProperties) {
      data.additionalProperties = this.recursivelyParseBody(
        objectBodySegment.additionalProperties,
      ) as OpenapiSchemaObject
    }

    if (Array.isArray(objectBodySegment.required)) data.required = objectBodySegment.required

    if (objectBodySegment.properties) {
      data.properties = this.parseObjectPropertyStatement(objectBodySegment.properties)
    }

    return data
  }

  /**
   * @internal
   *
   * parses either the `properties` or `additionalProperties` values
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
  ): OpenapiSchemaProperties {
    if (
      (propertySegment as OpenapiSchemaExpressionOneOf).oneOf ||
      (propertySegment as OpenapiSchemaExpressionAllOf).allOf ||
      (propertySegment as OpenapiSchemaExpressionAnyOf).anyOf
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this.recursivelyParseBody(propertySegment as any) as unknown as OpenapiSchemaProperties
    }

    const objectBodySegment = propertySegment as unknown as OpenapiSchemaObjectBase
    Object.keys(objectBodySegment || {}).forEach(key => {
      ;(propertySegment as Record<string, OpenapiSchemaBody | OpenapiSchemaBodyShorthand>)[key] =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
        this.recursivelyParseBody((objectBodySegment as any)[key])
    })

    return propertySegment as OpenapiSchemaProperties
  }

  /**
   * @internal
   *
   * recursively parses a primitive literal type (i.e. string or boolean[])
   */
  private primitiveLiteralStatement(
    bodySegment: OpenapiShorthandPrimitiveTypes,
  ): OpenapiSchemaPrimitiveGeneric {
    return primitiveOpenapiStatementToOpenapi(bodySegment) as OpenapiSchemaPrimitiveGeneric
  }

  /**
   * @internal
   *
   * recursively parses a primitive object type (i.e. { type: 'string[]' })
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
        suppressResponseEnums(this.openapiName)
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
  private serializerStatement(
    bodySegment: OpenapiBodySegment,
  ): OpenapiSchemaExpressionRef | OpenapiSchemaArray | OpenapiSchemaExpressionAllOf {
    const serializerRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializerRef
    const serializerRef = new SerializerOpenapiRenderer(serializerRefBodySegment.$serializer, {
      casing: this.casing,
      schemaDelimiter: this.schemaDelimeter,
      suppressResponseEnums: this.suppressResponseEnums,
    }).serializerRef

    if (serializerRefBodySegment.many) {
      const returnVal = {
        type: serializerRefBodySegment.maybeNull ? ['array', 'null'] : 'array',
        items: serializerRef,
      } as OpenapiSchemaArray

      return returnVal
    } else {
      if (serializerRefBodySegment.maybeNull) {
        return {
          allOf: [serializerRef, { type: 'null' }],
        }
      } else {
        return serializerRef
      }
    }
  }

  private serializableStatement(
    bodySegment: OpenapiBodySegment,
  ): OpenapiSchemaExpressionRef | OpenapiSchemaArray | OpenapiSchemaExpressionAllOf {
    const serializableRef = bodySegment as OpenapiSchemaShorthandExpressionSerializableRef
    const key = serializableRef.key || 'default'
    const serializerClass = inferSerializerFromDreamOrViewModel(
      serializableRef.$serializable.prototype as Dream,
      key,
    )

    if (!serializerClass)
      throw new Error(
        `Failed to locate serializers getter from: ${serializableRef.$serializable.name} using key: ${key}`,
      )

    return this.serializerStatement({
      $serializer: serializerClass,
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
