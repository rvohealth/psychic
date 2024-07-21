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

export default class OpenapiBodySegmentParser<
  DreamOrSerializer extends typeof Dream | typeof DreamSerializer,
> {
  private bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
  private attributeStatement?: AttributeStatement

  /**
   * @internal
   *
   * Used to recursively parse nested object structures
   * within nested openapi objects
   */
  constructor({
    bodySegment,
    attributeStatement,
  }: {
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined
    attributeStatement?: AttributeStatement
  }) {
    this.bodySegment = bodySegment
    this.attributeStatement = attributeStatement
  }

  /**
   * @internal
   *
   * recursive function used to parse nested
   * openapi shorthand objects
   */
  public parse(): OpenapiSchemaBody {
    return this.recursivelyParseBody(this.bodySegment)
  }

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
    }
  }

  private segmentType(bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined) {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand

    if (oneOfBodySegment.oneOf) {
      return 'oneOf'
    }

    if (anyOfBodySegment.anyOf) {
      return 'anyOf'
    }

    if (objectBodySegment.type === 'object') {
      return 'object'
    } else if (arrayBodySegment.type === 'array') {
      return 'array'
    } else {
      if (openapiShorthandPrimitiveTypes.includes(bodySegment as any)) {
        return 'openapi_primitive_literal'
      }

      if (typeof bodySegment === 'object') {
        if (openapiPrimitiveTypes.includes((bodySegment as any).type)) {
          return 'openapi_primitive_object'
        }

        if (refBodySegment.$ref) {
          return '$ref'
        }

        if (schemaRefBodySegment.$schema) {
          return '$schema'
        }
      }

      if (typeof bodySegment === 'object') return 'unknown_object'

      throw 'holy cow im here'
      // return this.parseAttributeValue(bodySegment, this.attributeStatement) as OpenapiSchemaBody
    }
  }

  private oneOfStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionOneOf {
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    return {
      oneOf: oneOfBodySegment.oneOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  private anyOfStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionAnyOf {
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    return {
      anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment)),
    }
  }

  private arrayStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaArray {
    const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
      type: 'array',
      items: this.recursivelyParseBody((bodySegment as any).items),
    })
    return data
  }

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
      data.properties![key] = this.recursivelyParseBody(objectBodySegment.properties![key] as any)
    })

    return data
  }

  private primitiveLiteralStatement(
    bodySegment: OpenapiShorthandPrimitiveTypes,
  ): OpenapiSchemaPrimitiveGeneric {
    return this.parseAttributeValue(bodySegment) as OpenapiSchemaPrimitiveGeneric
  }

  private primitiveObjectStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaPrimitiveGeneric {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    return this.applyCommonFieldsToPayload<OpenapiSchemaPrimitiveGeneric>(objectBodySegment as any)
  }

  private refStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionRef {
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    return {
      $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
    }
  }

  private schemaRefStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaExpressionRef {
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand
    return {
      $ref: `#/components/schemas/${schemaRefBodySegment.$schema.replace(/^#\/components\/schemas\//, '')}`,
    }
  }

  private unknownObjectStatement(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaBody {
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

  private applyCommonFieldsToPayload<
    Obj extends OpenapiSchemaBody | OpenapiSchemaObject | OpenapiSchemaArray,
  >(obj: Obj): Obj {
    const objectCast = obj as OpenapiSchemaObject
    const returnObj: Obj = {
      nullable: objectCast.nullable || false,
      ...obj,
    }

    if (objectCast.description) {
      ;(returnObj as any).description = objectCast.description
    }

    if (objectCast.summary) {
      ;(returnObj as any).summary = objectCast.summary
    }

    return returnObj
  }
}

export interface OpenapiRendererOpts<T extends typeof Dream | typeof DreamSerializer> {
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
