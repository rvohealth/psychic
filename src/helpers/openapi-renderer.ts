import { Dream, DreamSerializer } from '@rvohealth/dream'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
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
    const serializers = await PsychicDir.serializers()

    const finalOutput: any = {
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

        finalOutput.paths[path] ||= {
          parameters: [],
        }

        finalOutput.paths[path][method] = (endpointPayload as any)[path][method]
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
      throw 'RUH ROOOHHHHHH'
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

  private requestBody() {
    if (!this.body) return undefined
    return this.recursivelyParseBody(this.body)
  }

  private async parseResponses() {
    const responseData: any = {
      [this.status || 200]: await this.parseSerializerResponseShape(),
    }

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

  private async parseSerializerResponseShape() {
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
  ) {
    if (typeof data === 'object') {
      const output: any = {
        type: 'object',
        properties: {},
      }

      Object.keys(data).forEach(key => {
        output.properties[key] = this.parseSerializerAttributeRecursive(data[key], attribute)
      })

      return output
    }

    return this.parseAttributeValue(data, attribute)
  }

  private parseAttributeValue(data: SerializableTypes | undefined, attribute: AttributeStatement) {
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

  private serializerTypeToOpenapiType(type: SerializableTypes) {
    switch (type) {
      case 'datetime':
        return 'date-time'
      default:
        return (type as string).replace(/\[\]$/, '')
    }
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

export interface OpenapiSchemaBody {
  type: OpenapiAllTypes
  required: string[]
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
