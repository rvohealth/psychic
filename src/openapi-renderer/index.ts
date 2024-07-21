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
  OpenapiSchemaObject,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandPrimitiveTypes,
} from '@rvohealth/dream/src/openapi/types'
import { AttributeStatement, SerializableTypes } from '@rvohealth/dream/src/serializer/decorators/attribute'
import fs from 'fs/promises'
import PsychicController from '../controller'
import openapiJsonPath from '../helpers/openapiJsonPath'
import PsychicDir from '../helpers/psychicdir'
import { HttpMethod } from '../router/types'

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

  /**
   * @internal
   *
   * reads the lates openapi builds using buildOpenapiObject, and syncs
   * the contents to the openapi.json file at the project root.
   */
  public static async syncOpenapiJsonFile() {
    const openapiContents = await OpenapiRenderer.buildOpenapiObject()
    const jsonPath = openapiJsonPath()
    await fs.writeFile(jsonPath, JSON.stringify(openapiContents, null, 2), {
      flag: 'w+',
    })
  }

  /**
   * @internal
   *
   * builds a new typescript object which contains the combined
   * payloads of all `@Openapi` decorator calls used throughout
   * the controller layer.
   */
  public static async buildOpenapiObject(): Promise<OpenapiSchema> {
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

  /**
   * @internal
   *
   * Generates an openapi object representing a single endpoint.
   */
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

  /**
   * @internal
   *
   * Generates the serializer's openapi schema based
   * on first argument passed to each `@Attribute` decorator
   * on the given serializer
   */
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

  /**
   * @internal
   *
   * Generates the header portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
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

  /**
   * @internal
   *
   * Generates the path portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
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

  /**
   * @internal
   *
   * Generates the requestBody portion of the endpoint
   */
  private requestBody(): OpenapiSchemaBody | undefined {
    if (!this.body) return undefined
    return this.recursivelyParseBody(this.body)
  }

  /**
   * @internal
   *
   * Generates the responses portion of the endpoint
   */
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

  /**
   * @internal
   *
   * returns a ref object for a single serializer
   */
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

  /**
   * @internal
   *
   * builds the definition for the endpoint's serializer
   * to be placed in the components/schemas path
   */
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

      serializerObject.properties![attr.field] = this.recursivelyParseBody(attr.renderAs)
    })

    return serializerObject
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
   * recursive function used to parse nested
   * openapi shorthand objects
   */
  private recursivelyParseBody(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
    attributeStatement?: AttributeStatement,
  ): OpenapiSchemaBody {
    const objectBodySegment = bodySegment as OpenapiSchemaObject
    const arrayBodySegment = bodySegment as OpenapiSchemaArray
    const oneOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionOneOf
    const anyOfBodySegment = bodySegment as OpenapiSchemaShorthandExpressionAnyOf
    const refBodySegment = bodySegment as OpenapiSchemaExpressionRef

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
      }

      if (typeof bodySegment === 'object')
        return this.applyCommonFieldsToPayload(bodySegment as any) as OpenapiSchemaBody

      return this.parseAttributeValue(bodySegment, attributeStatement) as OpenapiSchemaBody
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

  /**
   * @internal
   *
   * Returns the serializer class either attached directly
   * to this OpenapiRenderer, or else travels through the
   * attached dream or view model to identify a serializer
   * match.
   */
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
