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
  OpenapiSchemaExpressionRef,
  OpenapiSchemaExpressionRefSchemaShorthand,
  OpenapiSchemaObject,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandPrimitiveTypes,
} from '@rvohealth/dream/src/openapi/types'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
import { HttpMethod } from '../router/types'

export default class OpenapiBodySegmentParser<
  DreamOrSerializer extends typeof Dream | typeof DreamSerializer,
> {
  /**
   * instantiates a new OpenapiRenderer.
   * This class is used by the `@Openapi` decorator
   * to store information related to a controller's action
   * for use in other parts of the app.
   *
   * the current sole purpose of this renderer is to store
   * endpoint information to use when generating an openapi.json
   * file, which is done using the static:
   * ```ts
   * const openapiJsonContents = await OpenapiRenderer.buildOpenapiObject()
   * const json = JSON.encode(openapiJsonContents, null, 2)
   * ```
   */
  constructor() {}

  /**
   * @internal
   *
   * recursive function used to parse nested
   * openapi shorthand objects
   */
  public recursivelyParseBody(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
    attributeStatement?: AttributeStatement,
  ): OpenapiSchemaBody {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef
    const schemaRefBodySegment = bodySegment as OpenapiSchemaExpressionRefSchemaShorthand

    if (oneOfBodySegment.oneOf) {
      return {
        oneOf: oneOfBodySegment.oneOf.map(segment => this.recursivelyParseBody(segment)),
      }
    }

    if (anyOfBodySegment.anyOf) {
      return {
        anyOf: anyOfBodySegment.anyOf.map(segment => this.recursivelyParseBody(segment)),
      }
    }

    if (objectBodySegment.type === 'object') {
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
        data.properties![key] = this.recursivelyParseBody(
          objectBodySegment.properties![key] as any,
          attributeStatement,
        )
      })

      return data
    } else if (arrayBodySegment.type === 'array') {
      const data = this.applyCommonFieldsToPayload<OpenapiSchemaArray>({
        type: 'array',
        items: this.recursivelyParseBody((bodySegment as any).items, attributeStatement),
      })
      return data
    } else {
      if (openapiPrimitiveTypes.includes(bodySegment as any)) {
        return this.applyCommonFieldsToPayload({
          type: bodySegment as any,
        })
      }

      if (typeof bodySegment === 'object') {
        if (openapiPrimitiveTypes.includes((bodySegment as any).type)) {
          return this.applyCommonFieldsToPayload<OpenapiSchemaBody>(objectBodySegment)
        }

        if (refBodySegment.$ref) {
          return {
            $ref: `#/${refBodySegment.$ref.replace(/^#\//, '')}`,
          }
        }

        if (schemaRefBodySegment.$schema) {
          return {
            $ref: `#/components/schemas/${schemaRefBodySegment.$schema.replace(/^#\/components\/schemas\//, '')}`,
          }
        }
      }

      if (typeof bodySegment === 'object')
        return this.applyCommonFieldsToPayload(bodySegment as any) as OpenapiSchemaBody

      return this.parseAttributeValue(bodySegment, attributeStatement) as OpenapiSchemaBody
    }
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
