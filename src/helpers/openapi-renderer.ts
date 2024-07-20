import { Dream, DreamSerializer } from '@rvohealth/dream'
import {
  AttributeStatement,
  SerializableObject,
  SerializableTypes,
} from '@rvohealth/dream/src/serializer/decorators/attribute'
import PsychicController from '../controller'
import { HttpMethod } from '../router/types'
import PsychicDir from './psychicdir'

export default class OpenapiRenderer<DreamOrSerializer extends typeof Dream | typeof DreamSerializer> {
  private many: OpenapiRendererOpts<DreamOrSerializer>['many']
  private path: OpenapiRendererOpts<DreamOrSerializer>['path']
  private method: OpenapiRendererOpts<DreamOrSerializer>['method']
  private responses: OpenapiRendererOpts<DreamOrSerializer>['responses']
  private serializerKey: OpenapiRendererOpts<DreamOrSerializer>['serializerKey']
  private uri: OpenapiRendererOpts<DreamOrSerializer>['uri']
  private body: OpenapiRendererOpts<DreamOrSerializer>['body']
  private headers: OpenapiRendererOpts<DreamOrSerializer>['headers']
  private status: OpenapiRendererOpts<DreamOrSerializer>['status']

  public static async buildOpenapiObject() {
    const controllers = await PsychicDir.controllers()

    const finalOutput: OpenapiSchema = {
      openapi: '3.0.2',
      paths: {},
      components: {
        schemas: {},
      },
    }

    for (const controllerName of Object.keys(controllers)) {
      const controller = controllers[controllerName] as typeof PsychicController
      for (const key of Object.keys(controller.openapi || {})) {
        const renderer = controller.openapi[key]

        finalOutput.components.schemas = {
          ...finalOutput.components.schemas,
          ...(await renderer.toSchemaObject()),
        }

        const endpointPayload = await renderer.toObject()
        const path = Object.keys(endpointPayload)[0]!
        const method = Object.keys(endpointPayload[path]).find(key =>
          ['get', 'post', 'delete', 'patch', 'options'].includes(key),
        )!

        ;(finalOutput.paths as any)[path] ||= {
          parameters: [],
        }
        ;(finalOutput.paths as any)[path][method] = (endpointPayload as any)[path][method]
      }
    }

    return finalOutput
  }

  constructor(
    private modelOrSerializerCb: () => DreamOrSerializer,
    {
      many,
      path,
      method,
      responses,
      status,
      serializerKey,
      uri,
      body,
      headers,
    }: OpenapiRendererOpts<DreamOrSerializer>,
  ) {
    this.many = many
    this.path = path
    this.method = method
    this.responses = responses
    this.serializerKey = serializerKey
    this.uri = uri
    this.body = body
    this.headers = headers
    this.status = status
  }

  public async toObject(): Promise<OpenapiEndpointResponse> {
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
              },
            },
          },
          responses: await this.parseResponses(),
        },
      },
    } as unknown as OpenapiEndpointResponse
  }

  public async toSchemaObject(): Promise<Record<string, OpenapiSchemaBody>> {
    const serializers = await PsychicDir.serializers()
    const serializerKey = Object.keys(serializers).find(key => serializers[key] === this.getSerializerClass())

    if (!serializerKey) {
      throw new Error(`
An unexpected error occurred while serializing your app.
A serializer was not able to be located:

${this.getSerializerClass().name}
`)
    }

    return {
      [serializerKey]: this.buildSerializerJson(),
    }
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

  private requestBody(): OpenapiSchemaBody | undefined {
    if (!this.body) return undefined
    return this.recursivelyParseBody(this.body)
  }

  private async parseResponses(): Promise<OpenapiResponses> {
    const responseData: OpenapiResponses = {
      [this.status || 200]: await this.parseSerializerResponseShape(),
    }

    Object.keys(this.responses || {}).forEach(statusCode => {
      responseData[parseInt(statusCode)] = {
        content: {
          'application/json': {
            schema: this.recursivelyParseBody(this.responses![statusCode as keyof typeof this.responses]),
          },
        },
      }
    })

    return responseData
  }

  private async parseSerializerResponseShape(): Promise<OpenapiContent> {
    const serializers = await PsychicDir.serializers()
    const serializerKey = Object.keys(serializers).find(key => serializers[key] === this.getSerializerClass())

    const serializerObject: OpenapiSchemaBody = {
      $ref: `#/components/schemas/${serializerKey}`,
    } as any

    const baseSchema = this.many
      ? {
          type: 'array',
          items: serializerObject,
        }
      : serializerObject

    const finalOutput: OpenapiContent = {
      content: {
        'application/json': {
          schema: baseSchema as any,
        },
      },
    }

    return finalOutput
  }

  private buildSerializerJson(): OpenapiSchemaBody {
    const serializerClass = this.getSerializerClass()
    const attributes = serializerClass['attributeStatements']

    const serializerObject: OpenapiSchemaBody = {
      type: 'object',
      required: [],
      properties: {},
    }

    attributes.forEach(attr => {
      if (!attr.options?.allowNull) {
        serializerObject.required!.push(attr.field)
      }

      serializerObject.properties![attr.field] = this.parseSerializerAttributeRecursive(attr.renderAs, attr)
    })

    return serializerObject
  }

  private parseSerializerAttributeRecursive(
    data: SerializableTypes | undefined,
    attribute: AttributeStatement,
  ): OpenapiSchemaBody {
    if (typeof data === 'object') {
      return this.parseSerializerObjectAttribute(data, attribute)
    }

    return this.parseAttributeValue(data, attribute)
  }

  private parseSerializerObjectAttribute(
    data: SerializableObject,
    attribute: AttributeStatement,
  ): OpenapiSchemaBody {
    const output: OpenapiSchemaBody = {
      type: 'object',
      properties: {},
    }

    Object.keys(data).forEach(key => {
      output.properties![key] = this.parseSerializerAttributeRecursive(data[key], attribute)
    })

    return output
  }

  private parseAttributeValue(
    data: SerializableTypes | undefined,
    attribute: AttributeStatement,
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
      case 'datetime[]':
      case 'decimal[]':
        return {
          type: 'array',
          items: {
            type: this.serializerTypeToOpenapiType(data),
            nullable: false,
          },
          nullable: attribute.options?.allowNull ?? false,
        }

      default:
        return {
          type: this.serializerTypeToOpenapiType(data),
          nullable: attribute.options?.allowNull ?? false,
        }
    }
  }

  private serializerTypeToOpenapiType(type: SerializableTypes): OpenapiPrimitiveTypes {
    switch (type) {
      case 'datetime':
        return 'date-time'
      default:
        return (type as string).replace(/\[\]$/, '') as OpenapiPrimitiveTypes
    }
  }

  private recursivelyParseBody(bodySegment: OpenapiSchemaBodyShorthand): OpenapiSchemaBody {
    if (bodySegment.type === 'object') {
      const data: OpenapiSchemaBody = {
        type: 'object',
        required: bodySegment.required,
        properties: {},
      }

      Object.keys(bodySegment.properties || {}).forEach(key => {
        data.properties![key] = this.recursivelyParseBody(bodySegment.properties![key] as any)
      })
      return data
    } else if (bodySegment.type === 'array') {
      const data: OpenapiSchemaBody = {
        type: 'array',
        items: this.recursivelyParseBody((bodySegment as any).items),
      }
      return data
    } else {
      if (openapiPrimitiveTypes.includes(bodySegment as any)) {
        return {
          type: bodySegment as any,
          nullable: false,
        }
      }

      return bodySegment as OpenapiSchemaBody
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
      schema: {
        type: OpenapiAllTypes
        properties?: OpenapiSchemaProperties
        required?: string[]
      }
    }
  } & {
    description?: string
  }
}

export interface OpenapiSchemaProperties {
  [key: string]: OpenapiSchemaBody
}

export type OpenapiSchemaBody =
  | {
      type: 'object'
      required?: string[]
      properties?: OpenapiSchemaProperties
      nullable?: boolean
    }
  | {
      type: 'array'
      items: OpenapiSchemaBody
      nullable?: boolean
    }
  | {
      type: OpenapiPrimitiveTypes
      nullable?: boolean
    }

export type OpenapiSchemaBodyShorthand =
  | {
      type: 'object'
      required?: string[]
      properties?: OpenapiSchemaPropertiesShorthand
      nullable?: boolean
    }
  | {
      type: 'array'
      items: OpenapiSchemaBodyShorthand
      nullable?: boolean
    }
  | {
      type: OpenapiPrimitiveTypes
      nullable?: boolean
    }

export interface OpenapiSchemaPropertiesShorthand {
  [key: string]: OpenapiSchemaBodyShorthand | OpenapiPrimitiveTypes
}

export const openapiPrimitiveTypes = ['string', 'boolean', 'number', 'date', 'date-time'] as const
export type OpenapiPrimitiveTypes = (typeof openapiPrimitiveTypes)[number]
export type OpenapiAllTypes = OpenapiPrimitiveTypes | 'object' | 'array'

export type OpenapiTypeField = OpenapiPrimitiveTypes | OpenapiTypeFieldObject

export interface OpenapiTypeFieldObject {
  [key: string]: OpenapiPrimitiveTypes | OpenapiTypeFieldObject
}

export type OpenapiFormats = 'application/json'
