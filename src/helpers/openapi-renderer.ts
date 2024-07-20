import { Dream, DreamSerializer } from '@rvohealth/dream'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
import { HttpMethod } from '../router/types'

export default class OpenapiRenderer<DreamOrSerializer extends typeof Dream | typeof DreamSerializer> {
  private path: OpenapiRendererOpts<DreamOrSerializer>['path']
  private method: OpenapiRendererOpts<DreamOrSerializer>['method']
  private responses: OpenapiRendererOpts<DreamOrSerializer>['responses']
  private serializerKey: OpenapiRendererOpts<DreamOrSerializer>['serializerKey']
  private uri: OpenapiRendererOpts<DreamOrSerializer>['uri']
  private body: OpenapiRendererOpts<DreamOrSerializer>['body']
  private headers: OpenapiRendererOpts<DreamOrSerializer>['headers']

  constructor(
    private modelOrSerializerCb: () => DreamOrSerializer,
    { path, method, responses, serializerKey, uri, body, headers }: OpenapiRendererOpts<DreamOrSerializer>,
  ) {
    this.path = path
    this.method = method
    this.responses = responses
    this.serializerKey = serializerKey
    this.uri = uri
    this.body = body
    this.headers = headers
  }

  public toObject(): OpenapiEndpointResponse {
    // const serializerClass = this.getSerializerClass()
    // console.log('schema object', this.schemaObject(), this.path, this.method)
    //

    return {
      [this.path]: {
        parameters: [...(this.headersArray() as any[]), ...(this.uriArray() as any[])],
        [this.method]: {
          tags: [],
          summary: '',
          requestBody: {
            content: {
              'application/json': {
                schema: this.requestBody(),
                // schema: {
                //   type: 'object',
                //   properties: this.schemaObject(),
                // },
              },
            },
          },
          responses: this.parseResponses(),
        },
      },
      // }
    } as unknown as OpenapiEndpointResponse
  }

  private headersArray(): OpenapiParameterResponse[] {
    return (
      this.headers?.map(header => ({
        in: 'header',
        ...header,
        description: header.description || '',
        schema: {
          type: 'string',
        },
      })) || []
    )
  }

  private uriArray(): OpenapiParameterResponse[] {
    return (
      this.uri?.map(param => {
        return {
          in: 'path',
          name: param.name,
          required: param.required,
          description: param.description || '',
          schema: {
            type: 'string',
          },
        }
      }) || []
    )
  }

  private requestBody() {
    if (!this.body) return undefined
    return this.recursivelyParseBody(this.body)
  }

  private parseResponses() {
    const responseData: any = {}
    Object.keys(this.responses || {}).forEach(statusCode => {
      responseData[statusCode] = {
        content: {
          'application/json': {
            schema: {
              ...this.recursivelyParseBody(this.responses![statusCode as keyof typeof this.responses]),
            },
          },
        },
      }
    })
    return responseData
  }

  private recursivelyParseBody(bodySegment: OpenapiSchemaBodyShorthand) {
    if (bodySegment.type === 'object') {
      const data: any = {
        type: 'object',
        required: bodySegment.required,
        properties: {},
      }

      Object.keys(bodySegment.properties || {}).forEach(key => {
        data.properties[key] = this.recursivelyParseBody(bodySegment.properties![key] as any)
      })
      return data
    } else {
      if (openapiPrimitiveTypes.includes(bodySegment as any)) {
        return {
          type: bodySegment,
          nullable: false,
        }
      }

      return bodySegment
    }
  }

  private schemaObject(): OpenapiSchemaProperties {
    const serializerClass = this.getSerializerClass()

    let obj: any = {}
    for (const attributeStatement of serializerClass['attributeStatements']) {
      obj = {
        ...obj,
        ...this.renderAsToObject(attributeStatement),
      }
    }

    return obj
  }

  private renderAsToObject(attributeStatement: AttributeStatement) {
    if (typeof attributeStatement.renderAs === 'object') {
      return {
        [attributeStatement.field]: this.recursiveRenderAsToObject(attributeStatement.renderAs),
      }
    } else {
      return {
        [attributeStatement.field]: {
          type: attributeStatement.renderAs,
        },
      }
    }
  }

  private recursiveRenderAsToObject(data: SerializableTypes | undefined): any {
    if (data === undefined) {
      return { type: 'any' }
    }

    if (typeof data === 'object') {
      const nestedData: any = {
        type: 'object',
        properties: {},
      }

      for (const key of Object.keys(data)) {
        nestedData.properties[key] = this.recursiveRenderAsToObject(data[key])
      }

      return nestedData
    }

    switch (data) {
      default:
        return {
          type: data,
        }
    }
  }

  private getSerializerClass(): typeof DreamSerializer {
    const modelOrSerializer = this.modelOrSerializerCb()

    if ((modelOrSerializer as typeof Dream).isDream) {
      const modelClass = modelOrSerializer as typeof Dream
      return modelClass.prototype.serializers[
        (this.serializerKey || 'default') as keyof typeof modelClass.prototype.serializers
      ]
    } else {
      return modelOrSerializer as typeof DreamSerializer
    }
  }
}

export interface OpenapiRendererOpts<T extends typeof Dream | typeof DreamSerializer> {
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
  responses: {
    [statusCode: number]: OpenapiContent
  }
}

export type OpenapiContent = {
  content: {
    [format in OpenapiFormats]: {
      schema: {
        type: OpenapiAllTypes
        properties?: OpenapiSchemaProperties
      }
    }
  } & {
    description?: string
  }
}

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export interface OpenapiSchemaBody {
  type: OpenapiAllTypes
  required?: boolean
  properties?: OpenapiSchemaProperties
}

export interface OpenapiSchemaPropertiesShorthand {
  [key: string]: OpenapiSchemaBodyShorthand | OpenapiPrimitiveTypes
}

export type OpenapiSchemaBodyShorthand =
  | {
      type: 'object'
      required?: string[]
      properties?: OpenapiSchemaPropertiesShorthand
    }
  | {
      type: OpenapiPrimitiveTypes
      nullable?: boolean
    }

export const openapiPrimitiveTypes = ['string', 'boolean', 'number'] as const
export type OpenapiPrimitiveTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiAllTypes = OpenapiPrimitiveTypes | 'object'

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
