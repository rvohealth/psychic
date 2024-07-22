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
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiSchemaShorthandExpressionAllOf,
  OpenapiSchemaShorthandExpressionAnyOf,
  OpenapiSchemaShorthandExpressionOneOf,
  OpenapiShorthandPrimitiveTypes,
} from '@rvohealth/dream/src/openapi/types'
import PsychicController from '../controller'
import PsychicDir from '../helpers/psychicdir'
import { RouteConfig } from '../router/route-manager'
import { HttpMethod } from '../router/types'
import PsychicServer from '../server'
import OpenapiBodySegmentRenderer from './body-segment'
import openapiRoute from './helpers/openapiRoute'

export default class OpenapiEndpointRenderer<DreamsOrSerializersCB extends DreamsOrSerializersOrViewModels> {
  private many: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['many']
  private path: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['path']
  private pathz: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['path']
  private method: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['method']
  private responses: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['responses']
  private serializerKey: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['serializerKey']
  private uri: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['uri']
  private body: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['body']
  private headers: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['headers']
  private query: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['query']
  private status: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['status']
  private tags: OpenapiEndpointRendererOpts<DreamsOrSerializersCB>['tags']

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
    private dreamsOrSerializersCb: (() => DreamsOrSerializersCB) | null,
    private controllerClass: typeof PsychicController,
    private action: string,
    {
      body,
      headers,
      many,
      method,
      path,
      query,
      responses,
      serializerKey,
      status,
      tags,
      uri,
    }: OpenapiEndpointRendererOpts<DreamsOrSerializersCB> = {},
  ) {
    this.body = body
    this.headers = headers
    this.many = many
    this.method = method
    this.path = path
    this.pathz = path
    this.query = query
    this.responses = responses
    this.serializerKey = serializerKey
    this.status = status
    this.tags = tags
    this.uri = uri
  }

  /**
   * @internal
   *
   * Generates an openapi object representing a single endpoint.
   */
  public async toObject(): Promise<OpenapiEndpointResponse> {
    return {
      [await this.computedPath()]: {
        parameters: [...this.headersArray(), ...this.uriArray(), ...this.queryArray()],
        [await this.computedMethod()]: {
          tags: this.tags || [],
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
    const serializerClasses = this.getSerializerClasses()
    if (!serializerClasses) return {}

    const serializers = await PsychicDir.serializers()

    let output: Record<string, OpenapiSchemaBody> = {}
    serializerClasses.forEach(serializerClass => {
      output = { ...output, ...this.buildSerializerJson(serializerClass, serializers) }
    })

    return output
  }

  /**
   * @internal
   *
   * returns the path that was provided in the options if it is available.
   * Otherwise, it examines the application's routes to determine
   * a controller action match.
   *
   * If no match is found, a MissingControllerActionPairingInRoutes exception.
   */
  private async computedMethod(): Promise<HttpMethod> {
    if (this.method) return this.method
    if (this._method) return this._method

    try {
      const route = await this.getCurrentRouteConfig()
      this._method = route.httpMethod
    } catch {
      this._method = this.guessHttpMethod()
    }

    return this._method
  }
  private _method: HttpMethod

  private guessHttpMethod() {
    switch (this.action) {
      case 'create':
        return 'post'
      case 'destroy':
        return 'delete'
      case 'update':
        return 'patch'
      default:
        return 'get'
    }
  }

  /**
   * @internal
   *
   * returns the path that was provided in the options if it is available.
   * Otherwise, it examines the application's routes to determine
   * a controller action match.
   *
   * If no match is found, a MissingControllerActionPairingInRoutes exception.
   */
  private async computedPath(): Promise<string> {
    if (this.path) return this.path
    if (this._path) return this._path

    const route = await this.getCurrentRouteConfig()
    this._path = openapiRoute(route.path)
    return this._path
  }
  private _path: string

  private async getCurrentRouteConfig() {
    await this._loadRoutes()
    const controllerActionString = await this.controllerClass.controllerActionPath(this.action)

    const route = this.routes.find(
      routeConfig => routeConfig.controllerActionString === controllerActionString,
    )
    if (!route) throw new MissingControllerActionPairingInRoutes(this.controllerClass, this.action)
    return route
  }

  private async _loadRoutes() {
    if (this._routes) return

    const server = new PsychicServer()
    await server.boot()
    this._routes = await server.routes()
  }

  private get routes() {
    if (!this._routes) throw new Error('must called _loadRoutes before accessing routes property')
    return this._routes
  }
  private _routes: RouteConfig[]

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
      [this.status || this.defaultStatus]: await this.parseSerializerResponseShape(),
    }

    Object.keys(this.responses || {}).forEach(statusCode => {
      responseData[parseInt(statusCode)] = {
        content: {
          'application/json': {
            schema: this.recursivelyParseBody(
              this.responses![statusCode as keyof typeof this.responses],
            ) as any,
          },
        },
      }
    })

    return responseData
  }

  private get defaultStatus() {
    if (!this.getSerializerClasses()) return 204
    return 200
  }

  /**
   * @internal
   *
   * returns a ref object for the callback passed to the
   * Openapi decorator.
   */
  private async parseSerializerResponseShape(): Promise<OpenapiContent | { description: string }> {
    const serializerClasses = this.getSerializerClasses()
    if (!serializerClasses) return { description: 'no content' }

    if (serializerClasses.length > 1) {
      return this.parseMultiEntitySerializerResponseShape()
    }

    return this.parseSingleEntitySerializerResponseShape()
  }

  /**
   * @internal
   *
   * Parses serializer response when @Openapi decorator was called
   * with a non-array entity for the cb return value, i.e.
   *
   * ```ts
   * @Openapi(() => User)
   * public show() {...}
   * ```
   */
  private async parseSingleEntitySerializerResponseShape(): Promise<OpenapiContent> {
    const serializers = await PsychicDir.serializers()
    const serializerClass = this.getSerializerClasses()![0]
    const serializerKey = Object.keys(serializers).find(key => serializers[key] === serializerClass)

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
   * Parses serializer response when @Openapi decorator was called
   * with an array entity for the cb return value, i.e.
   *
   * ```ts
   * @Openapi(() => [Comment, Reply])
   * public responses() {...}
   * ```
   */
  private async parseMultiEntitySerializerResponseShape(): Promise<OpenapiContent> {
    const serializers = await PsychicDir.serializers()

    const anyOf: OpenapiSchemaExpressionAnyOf = { anyOf: [] }

    this.getSerializerClasses()!.forEach(serializerClass => {
      const serializerKey = Object.keys(serializers).find(key => serializers[key] === serializerClass)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const serializerObject: OpenapiSchemaBody = {
        $ref: `#/components/schemas/${serializerKey}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any
      anyOf.anyOf.push(serializerObject)
    })

    const baseSchema = this.many
      ? {
          type: 'array',
          items: anyOf,
        }
      : anyOf

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

${serializerClass.name}
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

      ;(serializerObject as any).properties![attr.field] = this.recursivelyParseBody(attr.renderAs)
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
        ;(finalOutput as any)[serializerKey].properties![association.field] = {
          type: 'array',
          items: {
            $ref: `#/components/schemas/${associatedSerializerKey}`,
          },
        }
        break

      case 'RendersOne':
        ;(finalOutput as any)[serializerKey].properties![association.field] = {
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
    ;(finalOutput as any)[serializerKey].properties![association.field] = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getSerializerClasses(): (typeof DreamSerializer<any, any>)[] | null {
    if (!this.dreamsOrSerializersCb) return null

    const dreamsOrSerializers = this.dreamsOrSerializersCb()

    if (Array.isArray(dreamsOrSerializers)) {
      return dreamsOrSerializers.map(s => this.getSerializerClass(s))
    } else {
      return [this.getSerializerClass(dreamsOrSerializers)]
    }
  }

  private getSerializerClass(
    dreamOrSerializerOrViewModel: DreamOrSerializerOrViewModel,
  ): typeof DreamSerializer {
    if ((dreamOrSerializerOrViewModel as typeof DreamSerializer).isDreamSerializer) {
      return dreamOrSerializerOrViewModel as typeof DreamSerializer
    } else {
      const modelClass = dreamOrSerializerOrViewModel as typeof Dream
      return modelClass.prototype.serializers[
        (this.serializerKey || 'default') as keyof typeof modelClass.prototype.serializers
      ] as typeof DreamSerializer
    }
  }
}

export class MissingControllerActionPairingInRoutes extends Error {
  constructor(
    private controllerClass: typeof PsychicController,
    private action: string,
  ) {
    super()
  }
  public get message() {
    return `
ATTENTION:
  The @Openapi decorator call in the ${this.controllerClass.name} did not explicitly
  specify a 'path' option for the ${this.action} action. In this case, Psychic will
  automatically attempt to guess the correct route based on the entries in
  the 'conf/routes.ts' file.

  If it is unable to find a route pointing to this particular controller and action
  pairing, this exception is raised to gently remind you that you have a documented
  endpoint which you have not yet included a route entry for.
`
  }
}

export interface OpenapiEndpointRendererOpts<
  T extends DreamsOrSerializersOrViewModels,
  NonArrayT extends DreamsOrSerializersOrViewModels extends (infer R extends abstract new (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any)[]
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      R & (abstract new (...args: any) => any)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T & (abstract new (...args: any) => any) = DreamsOrSerializersOrViewModels extends (infer R extends
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abstract new (...args: any) => any)[]
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      R & (abstract new (...args: any) => any)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T & (abstract new (...args: any) => any),
> {
  method?: HttpMethod
  path?: string
  many?: boolean
  uri?: OpenapiUriOption[]
  headers?: OpenapiHeaderOption[]
  query?: OpenapiQueryOption[]
  body?: OpenapiSchemaBodyShorthand
  tags?: string[]
  responses?: {
    [statusCode: number]: OpenapiSchemaBodyShorthand
  }
  serializerKey?: InstanceType<NonArrayT> extends { serializers: { [key: string]: typeof DreamSerializer } }
    ? keyof InstanceType<NonArrayT>['serializers' & keyof InstanceType<NonArrayT>]
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
  [statusCode: number]: OpenapiContent | { description: string }
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
        | OpenapiSchemaExpressionAllOf
        | OpenapiSchemaExpressionOneOf
    }
  } & {
    description?: string
  }
}

export type DreamsOrSerializersOrViewModels = DreamOrSerializerOrViewModel | DreamOrSerializerOrViewModel[]

export type DreamOrSerializerOrViewModel =
  | typeof Dream
  | (typeof Dream)[]
  | typeof DreamSerializer
  | (abstract new (...args: any) => { serializers: Record<string, typeof DreamSerializer> })
