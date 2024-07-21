import {
  Dream,
  DreamSerializer,
  DreamSerializerAssociationStatement,
  OpenapiAllTypes,
  OpenapiFormats,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaProperties,
  testEnv,
  uniq,
} from '@rvohealth/dream'
import {
  OpenapiSchemaArray,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandPrimitiveTypes,
} from '@rvohealth/dream/src/openapi/types'
import PsychicDir from '../helpers/psychicdir'
import { HttpMethod } from '../router/types'
import OpenapiBodySegmentRenderer from './body-segment'

export default class OpenapiEndpointRenderer<
  DreamOrSerializer extends typeof Dream | typeof DreamSerializer,
> {
  private many: OpenapiEndpointRendererOpts<DreamOrSerializer>['many']
  private path: OpenapiEndpointRendererOpts<DreamOrSerializer>['path']
  private method: OpenapiEndpointRendererOpts<DreamOrSerializer>['method']
  private responses: OpenapiEndpointRendererOpts<DreamOrSerializer>['responses']
  private serializerKey: OpenapiEndpointRendererOpts<DreamOrSerializer>['serializerKey']
  private uri: OpenapiEndpointRendererOpts<DreamOrSerializer>['uri']
  private body: OpenapiEndpointRendererOpts<DreamOrSerializer>['body']
  private headers: OpenapiEndpointRendererOpts<DreamOrSerializer>['headers']
  private query: OpenapiEndpointRendererOpts<DreamOrSerializer>['query']
  private status: OpenapiEndpointRendererOpts<DreamOrSerializer>['status']

  /**
   * instantiates a new OpenapiEndpointRenderer.
   * This class is used by the `@Openapi` decorator
   * to store information related to a controller's action
   * for use in other parts of the app.
   *
   * the current sole purpose of this renderer is to store
   * endpoint information to use when generating an openapi.json
   * file, which is done using the static:
   * ```ts
   * const openapiJsonContents = await OpenapiEndpointRenderer.buildOpenapiObject()
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
      query,
    }: OpenapiEndpointRendererOpts<DreamOrSerializer>,
  ) {
    this.many = many
    this.path = path
    this.method = method
    this.responses = responses
    this.serializerKey = serializerKey
    this.uri = uri
    this.body = body
    this.headers = headers
    this.query = query
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
        parameters: [...this.headersArray(), ...this.uriArray(), ...this.queryArray()],
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

    return this.buildSerializerJson(this.getSerializerClass(), serializers)
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
   * Generates the header portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
  private queryArray(): OpenapiParameterResponse[] {
    return (
      this.query?.map(param => ({
        in: 'query',
        ...param,
        description: param.description || '',
        schema: {
          type: 'string',
        },
        allowReserved: param.allowReserved === undefined ? true : param.allowReserved,
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const serializerObject: OpenapiSchemaBody = {
      $ref: `#/components/schemas/${serializerKey}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
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
  private buildSerializerJson(
    serializerClass: typeof DreamSerializer,
    serializers: { [key: string]: typeof DreamSerializer },
  ): Record<string, OpenapiSchemaObject> {
    const attributes = serializerClass['attributeStatements']

    const serializerKey = Object.keys(serializers).find(key => serializers[key] === serializerClass)
    if (!serializerKey) {
      throw new Error(`
An unexpected error occurred while serializing your app.
A serializer was not able to be located:

${this.getSerializerClass().name}
`)
    }

    const serializerObject: OpenapiSchemaObject = {
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

    const serializerPayload = this.attachAssociationsToSerializerPayload(
      serializerClass,
      { [serializerKey]: serializerObject },
      serializers,
      serializerKey,
    )
    return serializerPayload
  }

  /**
   * @internal
   *
   * for each association existing on a given serializer,
   * attach the association's schema to the component schema
   * output, and also generate a $ref between the base
   * serializer and the new one.
   */
  private attachAssociationsToSerializerPayload(
    serializerClass: typeof DreamSerializer,
    serializerPayload: Record<string, OpenapiSchemaObject>,
    serializers: { [key: string]: typeof DreamSerializer },
    serializerKey: string,
  ) {
    const associations = serializerClass['associationStatements']

    let finalOutput = { ...serializerPayload }

    associations.forEach(association => {
      const associatedSerializers = DreamSerializer.getAssociatedSerializersForOpenapi(association)
      if (!associatedSerializers) throw new Error('RUH ROGH')

      if (!associatedSerializers) {
        if (!testEnv()) {
          console.warn(
            `
Warn: ${serializerClass.name} missing explicit serializer definition for ${association.type} ${association.field}, using type: 'object'
`,
          )
        }
      } else {
        if (associatedSerializers.length === 1) {
          // point the association directly to the schema
          finalOutput = this.addSingleSerializerAssociationToOutput({
            serializerClass,
            association,
            serializerKey,
            finalOutput,
            serializers,
            associatedSerializers,
          })
        } else {
          // leverage anyOf to handle an array of serializers
          finalOutput = this.addMultiSerializerAssociationToOutput({
            serializerClass,
            association,
            serializerKey,
            finalOutput,
            serializers,
            associatedSerializers,
          })
        }
      }
    })

    return finalOutput
  }

  /**
   * @internal
   *
   * points an association directly to the $ref associated
   * with the target serializer, and add target serializer
   * to the schema
   */
  private addSingleSerializerAssociationToOutput({
    serializerClass,
    associatedSerializers,
    serializers,
    finalOutput,
    serializerKey,
    association,
  }: {
    serializerClass: typeof DreamSerializer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associatedSerializers: (typeof DreamSerializer<any, any>)[]
    serializers: { [key: string]: typeof DreamSerializer }
    finalOutput: Record<string, OpenapiSchemaObject>
    serializerKey: string
    association: DreamSerializerAssociationStatement
  }) {
    const associatedSerializer = associatedSerializers[0]
    const associatedSerializerKey = Object.keys(serializers).find(
      key => serializers[key] === associatedSerializer,
    )
    if (associatedSerializers && !associatedSerializerKey)
      throw new Error(
        `Failed to identify serializer key for association: ${serializerClass.name}#${association.field}`,
      )

    finalOutput[serializerKey].required = uniq([
      ...(finalOutput[serializerKey].required || []),
      association.field,
    ])

    switch (association.type) {
      case 'RendersMany':
        finalOutput[serializerKey].properties![association.field] = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          },
        }
        break

      case 'RendersOne':
        finalOutput[serializerKey].properties![association.field] = {
          $ref: `#/components/schemas/${associatedSerializerKey}`,
        }
        break
    }

    const associatedSchema = this.buildSerializerJson(associatedSerializer, serializers)
    finalOutput = { ...finalOutput, ...associatedSchema }
    return finalOutput
  }

  /**
   * @internal
   *
   * leverages anyOf to cast multiple possible $ref values,
   * each pointing to its respective target serializer.
   */
  private addMultiSerializerAssociationToOutput({
    serializerClass,
    associatedSerializers,
    serializers,
    finalOutput,
    serializerKey,
    association,
  }: {
    serializerClass: typeof DreamSerializer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    associatedSerializers: (typeof DreamSerializer<any, any>)[]
    serializers: { [key: string]: typeof DreamSerializer }
    finalOutput: Record<string, OpenapiSchemaObject>
    serializerKey: string
    association: DreamSerializerAssociationStatement
  }) {
    const anyOf: (OpenapiSchemaExpressionRef | OpenapiSchemaArray)[] = []

    associatedSerializers.forEach(associatedSerializer => {
      const associatedSerializerKey = Object.keys(serializers).find(
        key => serializers[key] === associatedSerializer,
      )
      if (associatedSerializers && !associatedSerializerKey)
        throw new Error(
          `Failed to identify serializer key for association: ${serializerClass.name}#${association.field}`,
        )

      finalOutput[serializerKey].required = uniq([
        ...(finalOutput[serializerKey].required || []),
        association.field,
      ])

      switch (association.type) {
        case 'RendersMany':
          anyOf.push({
            type: 'array',
            items: {
              $ref: `#/components/schemas/${associatedSerializerKey}`,
            },
          })
          break

        case 'RendersOne':
          anyOf.push({
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          })
          break
      }

      const associatedSchema = this.buildSerializerJson(associatedSerializer, serializers)
      finalOutput = { ...finalOutput, ...associatedSchema }
    })

    finalOutput[serializerKey].properties![association.field] = {
      anyOf,
    }

    return finalOutput
  }

  /**
   * @internal
   *
   * recursive function used to parse nested
   * openapi shorthand objects
   */
  private recursivelyParseBody(
    bodySegment: OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
  ): OpenapiSchemaBody {
    return new OpenapiBodySegmentRenderer({ bodySegment }).parse()
  }

  /**
   * @internal
   *
   * Returns the serializer class either attached directly
   * to this OpenapiEndpointRenderer, or else travels through the
   * attached dream or view model to identify a serializer
   * match.
   */
  private getSerializerClass(): typeof DreamSerializer {
    const modelOrSerializer = this.modelOrSerializerCb()

    if ((modelOrSerializer as typeof Dream).isDream) {
      const modelClass = modelOrSerializer as typeof Dream
      return modelClass.prototype.serializers[this.serializerKey || 'default'] as typeof DreamSerializer
    } else {
      return modelOrSerializer as typeof DreamSerializer
    }
  }
}

export interface OpenapiEndpointRendererOpts<T extends typeof Dream | typeof DreamSerializer> {
  many?: boolean
  path: string
  method: HttpMethod
  uri?: OpenapiUriOption[]
  headers?: OpenapiHeaderOption[]
  query?: OpenapiQueryOption[]
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

export interface OpenapiQueryOption {
  name: string
  required: boolean
  description?: string
  allowReserved?: boolean
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

export type OpenapiHeaderType = 'header' | 'body' | 'path' | 'query'

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
