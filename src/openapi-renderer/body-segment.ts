import {
  Dream,
  DreamSerializer,
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
  OpenapiShorthandPrimitiveTypes,
  inferSerializerFromDreamOrViewModel,
  openapiShorthandPrimitiveTypes,
} from '@rvoh/dream'
import PsychicController from '../controller/index.js'
import { getCachedPsychicApplicationOrFail } from '../psychic-application/cache.js'
import isBlankDescription from './helpers/isBlankDescription.js'
import primitiveOpenapiStatementToOpenapi, {
  MaybeNullPrimitive,
  maybeNullPrimitiveToPrimitive,
} from './helpers/primitiveOpenapiStatementToOpenapi.js'
import OpenapiSerializerRenderer from './serializer.js'

export default class OpenapiBodySegmentRenderer {
  private controllerClass: typeof PsychicController
  private bodySegment: OpenapiBodySegment
  private serializers: { [key: string]: typeof DreamSerializer }
  private schemaDelimeter: string
  private computedExtraComponents: { [key: string]: OpenapiSchemaObject } = {}
  private processedSchemas: Record<string, boolean>
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
    controllerClass,
    bodySegment,
    serializers,
    schemaDelimeter,
    processedSchemas,
    target,
  }: {
    openapiName: string
    controllerClass: typeof PsychicController
    bodySegment: OpenapiBodySegment
    serializers: { [key: string]: typeof DreamSerializer }
    schemaDelimeter: string
    processedSchemas: Record<string, boolean>
    target: OpenapiBodyTarget
  }) {
    this.openapiName = openapiName
    this.controllerClass = controllerClass
    this.bodySegment = bodySegment
    this.serializers = serializers
    this.schemaDelimeter = schemaDelimeter
    this.processedSchemas = processedSchemas
    this.target = target
  }

  /**
   * returns the shorthanded body segment, parsed
   * to the appropriate openapi shape
   */
  public parse(): OpenapiEndpointParseResults {
    const results = this.recursivelyParseBody(this.bodySegment)
    return {
      results,
      extraComponents: this.computedExtraComponents,
    }
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
        return this.objectStatement(bodySegment)

      case 'array':
        return this.arrayStatement(bodySegment)

      case 'openapi_primitive_literal':
        return this.primitiveLiteralStatement(bodySegment as OpenapiShorthandPrimitiveTypes)

      case 'openapi_primitive_object':
        return this.primitiveObjectStatement(bodySegment as OpenapiShorthandPrimitiveTypes)

      case '$ref':
        return this.refStatement(bodySegment)

      case '$schema':
        return this.schemaRefStatement(bodySegment)

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
    if (serializerRefBodySegment.$serializer) return '$serializer'
    if (serializableRefBodySegment.$serializable) return '$serializable'
    if (refBodySegment.$ref) return '$ref'
    if (schemaRefBodySegment.$schema) return '$schema'
    if (oneOfBodySegment.oneOf) return 'oneOf'
    if (anyOfBodySegment.anyOf) return 'anyOf'
    if (allOfBodySegment.allOf) return 'allOf'
    if (objectBodySegment.type === 'object') return 'object'
    else if (arrayBodySegment.type === 'array') return 'array'
    else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      if (openapiShorthandPrimitiveTypes.includes(bodySegment as any)) return 'openapi_primitive_literal'

      if (typeof bodySegment === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        if (openapiShorthandPrimitiveTypes.includes((bodySegment as any).type))
          return 'openapi_primitive_object'
      }

      if (typeof bodySegment === 'object') return 'unknown_object'
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
  private arrayStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaArray {
    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: 'array',

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      items: this.recursivelyParseBody((bodySegment as any).items),
    })

    const description = (bodySegment as OpenapiSchemaArray).description

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
  private objectStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaObject {
    const objectBodySegment = bodySegment as OpenapiSchemaObjectBase
    const data: OpenapiSchemaObjectBase = {
      type: 'object',
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      return this.recursivelyParseBody(propertySegment as any) as unknown as OpenapiSchemaProperties
    }

    const objectBodySegment = propertySegment as unknown as OpenapiSchemaObjectBase
    Object.keys(objectBodySegment || {}).forEach(key => {
      ;(propertySegment as Record<string, OpenapiSchemaBody | OpenapiSchemaBodyShorthand>)[key] =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
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
    const safeBodySegment = bodySegment as Extract<OpenapiSchemaBase, { type: MaybeNullPrimitive }>

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

  private typeIsOpenapiArrayPrimitive(openapiType: MaybeNullPrimitive): boolean {
    return /\[\]$/.test(maybeNullPrimitiveToPrimitive(openapiType))
  }

  private applyConfigurationOptions<T>(obj: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const anyObj = obj as any
    const psychicApp = getCachedPsychicApplicationOrFail()

    if (typeof anyObj === 'object') {
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        anyObj?.type === 'string' &&
        this.target === 'response' &&
        psychicApp.openapi?.[this.openapiName]?.suppressResponseEnums
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
    const serializerKey = serializerRefBodySegment.$serializer.openapiName

    this.computedExtraComponents = {
      ...this.computedExtraComponents,
      ...new OpenapiSerializerRenderer({
        openapiName: this.openapiName,
        controllerClass: this.controllerClass,
        serializerClass: serializerRefBodySegment.$serializer,
        serializers: this.serializers,
        schemaDelimeter: this.schemaDelimeter,
        processedSchemas: this.processedSchemas,
        target: this.target,
      }).parse(),
    }

    if (serializerRefBodySegment.many) {
      const returnVal = {
        type: serializerRefBodySegment.maybeNull ? ['array', 'null'] : 'array',
        items: {
          $ref: `#/components/schemas/${serializerKey}`,
        },
      } as OpenapiSchemaArray

      return returnVal
    } else {
      if (serializerRefBodySegment.maybeNull) {
        return {
          allOf: [{ $ref: `#/components/schemas/${serializerKey}` }, { type: 'null' }],
        }
      } else {
        return {
          $ref: `#/components/schemas/${serializerKey}`,
        }
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
   * recursively a $schema statement
   */
  private schemaRefStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaExpressionRef {
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand
    return {
      $ref: `#/components/schemas/${schemaRefBodySegment.$schema.replace(/^#\/components\/schemas\//, '')}`,
    }
  }

  /**
   * @internal
   *
   * recursively an unknown_object statement
   */
  private unknownObjectStatement(bodySegment: OpenapiBodySegment): OpenapiSchemaBody {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(returnObj as any).description = objectCast.description
    }

    if (objectCast.summary) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(returnObj as any).summary = objectCast.summary
    }

    return returnObj
  }
}

export type OpenapiEndpointParseResults = {
  results: OpenapiSchemaBody
  extraComponents: { [key: string]: OpenapiSchemaObject }
}

export type OpenapiBodySegment =
  | OpenapiSchemaBodyShorthand
  | OpenapiShorthandPrimitiveTypes
  | { description: string }
  | undefined

export type OpenapiBodyTarget = 'request' | 'response'
