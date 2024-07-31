import {
  AttributeStatement,
  Dream,
  DreamSerializer,
  OpenapiAllTypes,
  OpenapiFormats,
  OpenapiPrimitiveTypes,
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaExpressionRefSchemaShorthand,
  OpenapiSchemaObject,
  OpenapiSchemaObjectBase,
  OpenapiSchemaPartialSegment,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaProperties,
  OpenapiSchemaShorthandExpressionAllOf,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiSchemaShorthandExpressionSerializerRef,
  OpenapiShorthandPrimitiveTypes,
  SerializableTypes,
  compact,
  openapiPrimitiveTypes,
  openapiShorthandPrimitiveTypes,
} from '@rvohealth/dream'
import { HttpMethod } from '../router/types'
import computedSerializerKeyOrFail from './helpers/computedSerializerKeyOrFail'
import serializerToOpenapiSchema from './helpers/serializerToOpenapiSchema'

export default class OpenapiBodySegmentRenderer {
  private bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
  private serializers: { [key: string]: typeof DreamSerializer }
  private schemaDelimeter: string
  private computedExtraComponents: { [key: string]: OpenapiSchemaObject } = {}

  /**
   * @internal
   *
   * Used to recursively parse nested object structures
   * within nested openapi objects
   */
  constructor({
    bodySegment,
    serializers,
    schemaDelimeter,
  }: {
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
    serializers: { [key: string]: typeof DreamSerializer }
    schemaDelimeter: string
  }) {
    this.bodySegment = bodySegment
    this.serializers = serializers
    this.schemaDelimeter = schemaDelimeter
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
  public recursivelyParseBody(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaBody {
    switch (this.segmentType(bodySegment)) {
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
  private segmentType(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ) {
    if (bodySegment === undefined) return undefined

    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const allOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAllOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand
    const serializerRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializerRef

    if (serializerRefBodySegment.$serializer) return '$serializer'
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
        if (openapiPrimitiveTypes.includes((bodySegment as any).type)) return 'openapi_primitive_object'
      }

      if (typeof bodySegment === 'object') return 'unknown_object'
    }
  }

  /**
   * @internal
   *
   * recursively parses a oneOf statement
   */
  private oneOfStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionOneOf {
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    return {
      oneOf: oneOfBodySegment.oneOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an anyOf statement
   */
  private anyOfStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionAnyOf {
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    return {
      anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an allOf statement
   */
  private allOfStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionAllOf {
    const allOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAllOf
    return {
      allOf: allOfBodySegment.allOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an array statement
   */
  private arrayStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaArray {
    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: 'array',

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      items: this.recursivelyParseBody((bodySegment as any).items),
    })
    return data
  }

  /**
   * @internal
   *
   * recursively parses an object statement
   */
  private objectStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaObject {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const data: OpenapiSchemaObjectBase = {
      type: 'object',
      properties: {},
    }

    if (objectBodySegment.description) {
      data.description = objectBodySegment.description
    }

    if (objectBodySegment.nullable) {
      data.nullable = true
    }

    if (objectBodySegment.summary) {
      data.summary = objectBodySegment.summary
    }

    if ((objectBodySegment as OpenapiSchemaObjectBase).maxProperties) {
      data.maxProperties = (objectBodySegment as OpenapiSchemaObjectBase).maxProperties
    }

    if ((objectBodySegment as OpenapiSchemaObjectBase).minProperties) {
      data.minProperties = (objectBodySegment as OpenapiSchemaObjectBase).minProperties
    }

    if ((objectBodySegment as OpenapiSchemaObjectBase).additionalProperties) {
      data.additionalProperties = this.parseObjectPropertyStatement(
        (objectBodySegment as OpenapiSchemaObjectBase).additionalProperties!,
      )
    }

    if (Array.isArray(objectBodySegment.required)) data.required = objectBodySegment.required

    if ((objectBodySegment as OpenapiSchemaObjectBase).properties) {
      data.properties = this.parseObjectPropertyStatement(
        (objectBodySegment as OpenapiSchemaObjectBase).properties!,
      )
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
    return this.parseAttributeValue(bodySegment) as OpenapiSchemaPrimitiveGeneric
  }

  /**
   * @internal
   *
   * recursively parses a primitive object type (i.e. { type: 'string[]' })
   */
  private primitiveObjectStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaPrimitiveGeneric {
    const objectBodySegment = bodySegment as OpenapiSchemaObject

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    return this.applyCommonFieldsToPayload<OpenapiSchemaPrimitiveGeneric>(objectBodySegment as any)
  }

  /**
   * @internal
   *
   * recursively a $ref statement
   */
  private refStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionRef {
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
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionRef | OpenapiSchemaArray | OpenapiSchemaExpressionAllOf {
    const serializerRefBodySegment = bodySegment as OpenapiSchemaShorthandExpressionSerializerRef
    const serializerKey = computedSerializerKeyOrFail(
      serializerRefBodySegment.$serializer,
      this.serializers,
      this.schemaDelimeter,
    )

    this.computedExtraComponents = {
      ...this.computedExtraComponents,
      ...serializerToOpenapiSchema({
        serializerClass: serializerRefBodySegment.$serializer,
        serializers: this.serializers,
        schemaDelimeter: this.schemaDelimeter,
      }),
    }

    if (serializerRefBodySegment.many) {
      const returnVal = {
        type: 'array',
        items: {
          $ref: `#/components/schemas/${serializerKey}`,
        },
      } as OpenapiSchemaArray

      if (serializerRefBodySegment.nullable) returnVal.nullable = true

      return returnVal
    } else {
      if (serializerRefBodySegment.nullable) {
        return {
          allOf: [{ $ref: `#/components/schemas/${serializerKey}` }, { nullable: true }],
        }
      } else {
        return {
          $ref: `#/components/schemas/${serializerKey}`,
        }
      }
    }
  }

  /**
   * @internal
   *
   * recursively a $schema statement
   */
  private schemaRefStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaExpressionRef {
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
  private unknownObjectStatement(
    bodySegment:
      | OpenapiSchemaBodyShorthand
      | OpenapiShorthandPrimitiveTypes
      | OpenapiSchemaPartialSegment
      | undefined,
  ): OpenapiSchemaBody {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.applyCommonFieldsToPayload(bodySegment as any) as OpenapiSchemaBody
  }

  /**
   * @internal
   *
   * parses a primitive stored type
   */
  private parseAttributeValue(
    data: SerializableTypes | undefined,
    attribute?: AttributeStatement,
  ): OpenapiSchemaBody {
    if (!data)
      return {
        type: 'object',
        nullable: true,
      }

    switch (data) {
      case 'string[]':
      case 'number[]':
      case 'boolean[]':
      case 'integer[]':
        return compact({
          type: 'array',
          items: {
            type: this.serializerTypeToOpenapiType(data),
          },
          nullable: attribute?.options?.allowNull ?? undefined,
        }) as OpenapiSchemaBody

      case 'decimal[]':
      case 'double[]':
        return compact({
          type: 'array',
          items: {
            type: 'number',
            format: data.replace(/\[\]$/, '') as 'double' | 'decimal',
          },
          nullable: attribute?.options?.allowNull ?? undefined,
        }) as OpenapiSchemaBody

      case 'date[]':
      case 'date-time[]':
        return compact({
          type: 'array',
          items: {
            type: 'string',
            format: data.replace(/\[\]$/, ''),
          },
          nullable: attribute?.options?.allowNull ? true : undefined,
        }) as OpenapiSchemaBody

      case 'decimal':
      case 'double':
        return compact({
          type: 'number',
          format: data,
          nullable: attribute?.options?.allowNull ? true : undefined,
        }) as OpenapiSchemaBody

      case 'date':
      case 'date-time':
        return compact({
          type: 'string',
          format: data,
          nullable: attribute?.options?.allowNull ? true : undefined,
        }) as OpenapiSchemaBody

      default:
        return compact({
          type: this.serializerTypeToOpenapiType(data),
          nullable: attribute?.options?.allowNull ? true : undefined,
        }) as OpenapiSchemaBody
    }
  }

  /**
   * @internal
   *
   * sanitizes primitive openapi type before putting in
   * openapi type fields
   */
  private serializerTypeToOpenapiType(type: SerializableTypes): OpenapiPrimitiveTypes {
    switch (type) {
      case 'date':
      case 'date-time':
      case 'date[]':
      case 'date-time[]':
        return 'string'

      default:
        return (type as string).replace(/\[\]$/, '') as OpenapiPrimitiveTypes
    }
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

    if (objectCast.nullable) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      ;(returnObj as any).nullable = true
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

export interface OpenapiEndpointRendererOpts<T extends typeof Dream | typeof DreamSerializer> {
  many?: boolean
  path: string
  method: HttpMethod
  uri?: OpenapiUriOption[]
  headers?: OpenapiHeaderOption[]
  body?: OpenapiSchemaBodyShorthand
  responses?: {
    [statusCode: number]: OpenapiSchemaBodyShorthand
  }
  serializerKey?: T extends typeof Dream
    ? keyof InstanceType<T>['serializers' & keyof InstanceType<T>]
    : undefined
  status?: number
}

export interface OpenapiHeaderOption {
  name: string
  required: boolean
  description?: string
}

export interface OpenapiUriOption {
  name: string
  required: boolean
  description?: string
}

export interface OpenapiSchema {
  openapi: `${number}.${number}.${number}`
  info: {
    version: string
    title: string
    description: string
  }
  paths: OpenapiEndpointResponse
  components: {
    schemas: {
      [key: string]: OpenapiSchemaBody
    }
  }
}

export type OpenapiEndpointResponse = {
  [path: string]: {
    [method in HttpMethod]: OpenapiMethodBody
  } & {
    parameters: OpenapiParameterResponse[]
  }
}

export interface OpenapiParameterResponse {
  in: OpenapiHeaderType
  name: string
  required: boolean
  description: string
  schema: {
    type: 'string' | { type: 'object'; properties: OpenapiSchemaProperties }
  }
}

export type OpenapiHeaderType = 'header' | 'body' | 'path'

export type OpenapiMethodResponse = {
  [method in HttpMethod]: OpenapiMethodBody
}

export interface OpenapiMethodBody {
  tags: string[]
  summary: string
  requestBody: OpenapiContent
  responses: OpenapiResponses
}

export interface OpenapiResponses {
  [statusCode: number]: OpenapiContent
}

export type OpenapiContent = {
  content: {
    [format in OpenapiFormats]: {
      schema:
        | {
            type: OpenapiAllTypes
            properties?: OpenapiSchemaProperties
            required?: string[]
          }
        | OpenapiSchemaExpressionRef
        | OpenapiSchemaExpressionAnyOf
        | OpenapiSchemaShorthandExpressionOneOf
    }
  } & {
    description?: string
  }
}

export type OpenapiEndpointParseResults = {
  results: OpenapiSchemaBody
  extraComponents: { [key: string]: OpenapiSchemaObject }
}
