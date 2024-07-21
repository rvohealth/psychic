import {
  Dream,
  DreamSerializer,
  OpenapiAllTypes,
  OpenapiFormats,
  OpenapiPrimitiveTypes,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaProperties,
  openapiPrimitiveTypes,
} from '@rvohealth/dream'
import {
  OpenapiSchemaArray,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaExpressionRefSchemaShorthand,
  OpenapiSchemaObject,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandPrimitiveTypes,
  openapiShorthandPrimitiveTypes,
} from '@rvohealth/dream/src/openapi/types'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
import { HttpMethod } from '../router/types'

export default class OpenapiBodySegmentRenderer {
  private bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined

  /**
   * @internal
   *
   * Used to recursively parse nested object structures
   * within nested openapi objects
   */
  constructor({
    bodySegment,
  }: {
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
  }) {
    this.bodySegment = bodySegment
  }

  /**
   * returns the shorthanded body segment, parsed
   * to the appropriate openapi shape
   */
  public parse(): OpenapiSchemaBody {
    return this.recursivelyParseBody(this.bodySegment)
  }

  /**
   * @internal
   *
   * Recursively parses nested objects and arrays,
   * as well as primitive types
   */
  public recursivelyParseBody(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaBody {
    switch (this.segmentType(bodySegment)) {
      case 'oneOf':
        return this.oneOfStatement(bodySegment)

      case 'anyOf':
        return this.anyOfStatement(bodySegment)

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
  private segmentType(bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined) {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand

    if (oneOfBodySegment.oneOf) return 'oneOf'
    if (anyOfBodySegment.anyOf) return 'anyOf'
    if (objectBodySegment.type === 'object') return 'object'
    else if (arrayBodySegment.type === 'array') return 'array'
    else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      if (openapiShorthandPrimitiveTypes.includes(bodySegment as any)) return 'openapi_primitive_literal'

      if (typeof bodySegment === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
        if (openapiPrimitiveTypes.includes((bodySegment as any).type)) return 'openapi_primitive_object'

        if (refBodySegment.$ref) return '$ref'
        if (schemaRefBodySegment.$schema) return '$schema'
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionAnyOf {
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    return {
      anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  /**
   * @internal
   *
   * recursively parses an array statement
   */
  private arrayStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaObject {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    let data: OpenapiSchemaObject = {
      type: 'object',
      properties: {},
      nullable: objectBodySegment.nullable || false,
    }

    if (objectBodySegment.description) {
      data.description = objectBodySegment.description
    }

    if (objectBodySegment.summary) {
      data.summary = objectBodySegment.summary
    }

    data = this.applyCommonFieldsToPayload<OpenapiSchemaObject>(data)

    if (objectBodySegment.required !== undefined) data.required = objectBodySegment.required

    Object.keys(objectBodySegment.properties || {}).forEach(key => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      data.properties![key] = this.recursivelyParseBody(objectBodySegment.properties![key] as any)
    })

    return data
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionRef {
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    return {
      $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
    }
  }

  /**
   * @internal
   *
   * recursively a $schema statement
   */
  private schemaRefStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
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
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
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
      case 'date[]':
      case 'date-time[]':
      case 'decimal[]':
        return {
          type: 'array',
          items: {
            type: this.serializerTypeToOpenapiType(data),
            nullable: false,
          },
          nullable: attribute?.options?.allowNull ?? false,
        }

      default:
        return {
          type: this.serializerTypeToOpenapiType(data),
          nullable: attribute?.options?.allowNull ?? false,
        }
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
      nullable: objectCast.nullable || false,
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
