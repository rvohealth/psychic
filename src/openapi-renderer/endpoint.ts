import {
  Dream,
  DreamClassOrViewModelClassOrSerializerClass,
  DreamSerializer,
  OpenapiAllTypes,
  OpenapiFormats,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiSchemaProperties,
  OpenapiShorthandPrimitiveTypes,
} from '@rvohealth/dream'
import PsychicController from '../controller'
import PsychicDir from '../helpers/psychicdir'
import { getCachedPsyconfOrFail } from '../psyconf/cache'
import { RouteConfig } from '../router/route-manager'
import { HttpMethod } from '../router/types'
import PsychicServer from '../server'
import OpenapiBodySegmentRenderer from './body-segment'
import computedSerializerKeyOrFail from './helpers/computedSerializerKeyOrFail'
import openapiRoute from './helpers/openapiRoute'
import serializerToOpenapiSchema from './helpers/serializerToOpenapiSchema'

export default class OpenapiEndpointRenderer<
  DreamsOrSerializersCBReturnVal extends
    | DreamClassOrViewModelClassOrSerializerClass
    | DreamClassOrViewModelClassOrSerializerClass[],
> {
  private many: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['many']
  private responses: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['responses']
  private serializerKey: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['serializerKey']
  private pathParams: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['pathParams']
  private body: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['body']
  private headers: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['headers']
  private query: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['query']
  private status: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['status']
  private tags: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['tags']
  private description: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['description']
  private nullable: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal>['nullable']
  private serializers: { [key: string]: typeof DreamSerializer }
  private computedExtraComponents: { [key: string]: OpenapiSchemaObject } = {}

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
    private dreamsOrSerializersCb: (() => DreamsOrSerializersCBReturnVal) | null,
    private controllerClass: typeof PsychicController,
    private action: string,
    {
      body,
      headers,
      many,
      query,
      responses,
      serializerKey,
      status,
      tags,
      pathParams,
      description,
      nullable,
    }: OpenapiEndpointRendererOpts<DreamsOrSerializersCBReturnVal> = {},
  ) {
    this.body = body
    this.headers = headers
    this.many = many
    this.query = query
    this.responses = responses
    this.serializerKey = serializerKey
    this.status = status
    this.tags = tags
    this.pathParams = pathParams
    this.description = description
    this.nullable = nullable
  }

  /**
   * @internal
   *
   * Generates an openapi object representing a single endpoint.
   */
  public async toObject(): Promise<OpenapiEndpointResponse> {
    this.serializers = await PsychicDir.serializers()

    const [path, method, requestBody, responses] = await Promise.all([
      this.computedPath(),
      this.computedMethod(),
      this.requestBody(),
      this.parseResponses(),
    ])

    const output = {
      [path]: {
        parameters: [...this.headersArray(), ...(await this.pathParamsArray()), ...this.queryArray()],
        [method]: {
          tags: this.tags || [],
          summary: '',
          responses,
        },
      },
    } as unknown as OpenapiEndpointResponse

    if (requestBody) {
      output[path][method]['requestBody'] = requestBody
    }

    return output
  }

  /**
   * @internal
   *
   * Generates the serializer's openapi schema based
   * on first argument passed to each `@Attribute` decorator
   * on the given serializer
   */
  public async toSchemaObject(): Promise<Record<string, OpenapiSchemaBody>> {
    this.serializers = await PsychicDir.serializers()
    const serializerClasses = this.getSerializerClasses()

    let output: Record<string, OpenapiSchemaBody> = {}

    ;(serializerClasses || ([] as (typeof DreamSerializer)[])).forEach(serializerClass => {
      output = {
        ...output,
        ...serializerToOpenapiSchema({
          serializerClass,
          schemaDelimeter: this.schemaDelimeter,
          serializers: this.serializers,
        }),
      }
    })

    // run this to extract all $serializer refs from responses object
    // and put them into the computedExtraComponents field
    this.parseResponses()

    return { ...output, ...this.computedExtraComponents }
  }

  /**
   * @internal
   *
   * returns the method that was provided in the options if it is available.
   * Otherwise, it examines the application's routes to determine
   * a controller method match.
   *
   * If no match is found, a guess is taken as to the correct method
   * based on the name of the controller action. If the action is not
   * a standardized crud action, then `get` will be returned.
   */
  private async computedMethod(): Promise<HttpMethod> {
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

  /**
   * @internal
   *
   * Generates the path portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
  private async pathParamsArray(): Promise<OpenapiParameterResponse[]> {
    if (this._pathParams) return this._pathParams

    const userProvidedPathParams = (this.pathParams?.map(param => {
      return {
        in: 'path',
        name: param.name,
        required: param.required,
        description: param.description || '',
        schema: {
          type: 'string',
        },
      }
    }) || []) as OpenapiParameterResponse[]

    const route = await this.getCurrentRouteConfig()
    const pathSegments = route.path
      .split('/')
      .filter(pathSegment => /^:/.test(pathSegment))
      .map(field => {
        const sanitizedField = field.replace(/^:/, '')
        return {
          in: 'path',
          name: sanitizedField,
          required: true,
          description: sanitizedField,
          schema: {
            type: 'string',
          },
        }
      })

    this._pathParams = [...pathSegments, ...userProvidedPathParams] as OpenapiParameterResponse[]

    return this._pathParams
  }
  private _pathParams: OpenapiParameterResponse[]

  /**
   * @internal
   *
   * Takes a guess as to the correct method
   * based on the name of the controller action. If the action is not
   * a standardized crud action, then `get` will be returned.
   */
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
    if (this._path) return this._path

    const route = await this.getCurrentRouteConfig()
    this._path = openapiRoute(route.path)
    return this._path
  }
  private _path: string

  /**
   * @internal
   *
   * find and memoize the route corresponding to this controller.
   * If no match is found, a MissingControllerActionPairingInRoutes exception.
   */
  private async getCurrentRouteConfig() {
    await this._loadRoutes()
    const controllerActionString = await this.controllerClass.controllerActionPath(this.action)

    const route = this.routes.find(
      routeConfig => routeConfig.controllerActionString === controllerActionString,
    )
    if (!route) throw new MissingControllerActionPairingInRoutes(this.controllerClass, this.action)
    return route
  }

  /**
   * @internal
   *
   * loads all routes for this psychic app and memoizes them
   */
  private async _loadRoutes() {
    if (this._routes) return

    const server = new PsychicServer()
    await server.boot()
    this._routes = await server.routes()
  }

  /**
   * @internal
   *
   * Returns the loaded routes (loaded by the #_loadRoutes method)
   */
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
      this.headers?.map(header => {
        const data = {
          in: 'header',
          name: header.name,
          required: header.required,
          description: header.description || '',
          schema: {
            type: 'string',
          },
        } as OpenapiParameterResponse

        if (header.format) {
          data.schema.format = header.format
        }

        return data
      }) || []
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
   * Generates the requestBody portion of the endpoint
   */
  private async requestBody(): Promise<OpenapiContent | undefined> {
    if ((await this.computedMethod()) === 'get') return undefined
    if (!this.body) return undefined

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const schema = this.recursivelyParseBody(this.body) as any
    if (!schema) return undefined

    return {
      content: {
        'application/json': {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          schema,
        },
      },
    }
  }

  /**
   * @internal
   *
   * Generates the responses portion of the endpoint
   */
  private parseResponses(): OpenapiResponses {
    const responseData: OpenapiResponses = {
      [this.status || this.defaultStatus]: this.parseSerializerResponseShape(),
    }

    Object.keys(this.responses || {}).forEach(statusCode => {
      const statusCodeInt = parseInt(statusCode)
      responseData[statusCodeInt] = {
        description: this.responses![statusCodeInt].description || this.action,
        content: {
          'application/json': {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            schema: this.recursivelyParseBody(
              this.responses![statusCodeInt],
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ) as any,
          },
        },
      }
    })

    return responseData
  }

  /**
   * @internal
   *
   * Returns the default status code that should be used
   * if it was not passed.
   */
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
  private parseSerializerResponseShape(): OpenapiContent | { description: string } {
    const serializerClasses = this.getSerializerClasses()
    if (!serializerClasses) return { description: 'no content' }

    if (serializerClasses.length > 1) {
      return this.parseMultiEntitySerializerResponseShape()
    }

    return this.parseSingleEntitySerializerResponseShape()
  }

  private accountForNullableOption<T>(bodySegment: T, nullable: boolean): T | OpenapiSchemaExpressionAllOf {
    if (nullable) {
      return {
        allOf: [bodySegment, { nullable: true }],
      } as OpenapiSchemaExpressionAllOf
    } else {
      return bodySegment
    }
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
  private parseSingleEntitySerializerResponseShape(): OpenapiContent {
    const serializerClass = this.getSerializerClasses()![0]
    const serializerKey = computedSerializerKeyOrFail(serializerClass, this.serializers, this.schemaDelimeter)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const serializerObject: OpenapiSchemaBody = this.accountForNullableOption(
      {
        $ref: `#/components/schemas/${serializerKey}`,
      },
      this.nullable || false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any

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
      description: this.description || this.action,
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
  private parseMultiEntitySerializerResponseShape(): OpenapiContent {
    const anyOf: OpenapiSchemaExpressionAnyOf = { anyOf: [] }

    this.getSerializerClasses()!.forEach(serializerClass => {
      const serializerKey = computedSerializerKeyOrFail(
        serializerClass,
        this.serializers,
        this.schemaDelimeter,
      )

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
   * returns either the delimiter set in the app config, or else a blank string
   * NOTE: this is only public for testing purposes.
   */
  public get schemaDelimeter() {
    const psyconf = getCachedPsyconfOrFail()
    return psyconf.openapi?.schemaDelimeter || ''
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
    const { results, extraComponents } = new OpenapiBodySegmentRenderer({
      bodySegment,
      serializers: this.serializers,
      schemaDelimeter: this.schemaDelimeter,
    }).parse()

    this.computedExtraComponents = {
      ...this.computedExtraComponents,
      ...extraComponents,
    }

    return results
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

  /**
   * @internal
   *
   * Uses the provided entity to resolve to a serializer class.
   */
  private getSerializerClass(
    dreamOrSerializerOrViewModel: DreamClassOrViewModelClassOrSerializerClass,
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
OpenAPI decorator has been applied to method '${this.action}' in '${this.controllerClass.name}',
but no route maps to this method in your conf/routes.ts file.

Either remove the @OpenAPI decorator for '${this.action}', or add a route to the
routes file which will direct to this controller class and method.`
  }
}

export interface OpenapiEndpointRendererOpts<
  T extends DreamClassOrViewModelClassOrSerializerClass | DreamClassOrViewModelClassOrSerializerClass[],
  NonArrayT extends T extends (infer R extends abstract new (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => any)[]
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      R & (abstract new (...args: any) => any)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T & (abstract new (...args: any) => any) = T extends (infer R extends
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    abstract new (...args: any) => any)[]
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      R & (abstract new (...args: any) => any)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T & (abstract new (...args: any) => any),
> {
  many?: boolean
  pathParams?: OpenapiPathParamOption[]
  headers?: OpenapiHeaderOption[]
  query?: OpenapiQueryOption[]
  body?: OpenapiSchemaBodyShorthand
  tags?: string[]
  description?: string
  summary?: string
  responses?: {
    [statusCode: number]: OpenapiSchemaBodyShorthand & { description?: string }
  }
  serializerKey?: InstanceType<NonArrayT> extends { serializers: { [key: string]: typeof DreamSerializer } }
    ? keyof InstanceType<NonArrayT>['serializers' & keyof InstanceType<NonArrayT>]
    : undefined
  status?: number
  nullable?: boolean
}

export interface OpenapiHeaderOption {
  name: string
  required: boolean
  description?: string
  format?: 'date' | 'date-time'
}

export interface OpenapiQueryOption {
  name: string
  required: boolean
  description?: string
  allowReserved?: boolean
}

export interface OpenapiPathParamOption {
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
    format?: 'date' | 'date-time'
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
  }
  description?: string
}
