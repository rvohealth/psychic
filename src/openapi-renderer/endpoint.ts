import {
  Dream,
  DreamApplication,
  DreamSerializer,
  OpenapiAllTypes,
  OpenapiFormats,
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaExpressionAllOf,
  OpenapiSchemaExpressionAnyOf,
  OpenapiSchemaExpressionOneOf,
  OpenapiSchemaExpressionRef,
  OpenapiSchemaObject,
  OpenapiSchemaProperties,
  SerializableDreamClassOrViewModelClass,
  SerializableDreamOrViewModel,
  compact,
} from '@rvohealth/dream'
import PsychicController from '../controller'
import { HttpStatusCode, HttpStatusCodeNumber } from '../error/http/status-codes'
import PsychicApplication from '../psychic-application'
import { RouteConfig } from '../router/route-manager'
import { HttpMethod } from '../router/types'
import PsychicServer from '../server'
import OpenapiBodySegmentRenderer, { OpenapiBodySegment } from './body-segment'
import { DEFAULT_OPENAPI_RESPONSES } from './defaults'
import openapiRoute from './helpers/openapiRoute'
import OpenapiSerializerRenderer from './serializer'

export default class OpenapiEndpointRenderer<
  DreamsOrSerializersOrViewModels extends
    | SerializableDreamClassOrViewModelClass
    | SerializableDreamClassOrViewModelClass[]
    | typeof DreamSerializer
    | (typeof DreamSerializer)[],
> {
  private many: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['many']
  private responses: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['responses']
  private serializerKey: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['serializerKey']
  private pathParams: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['pathParams']
  private requestBody: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['requestBody']
  private headers: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['headers']
  private query: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['query']
  private status: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['status']
  private tags: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['tags']
  private summary: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['summary']
  private description: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['description']
  private nullable: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['nullable']
  private omitDefaultHeaders: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['omitDefaultHeaders']
  private omitDefaultResponses: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['omitDefaultResponses']
  private defaultResponse: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['defaultResponse']
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
    private dreamsOrSerializers: DreamsOrSerializersOrViewModels | null,
    private controllerClass: typeof PsychicController,
    private action: string,
    {
      requestBody,
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
      summary,
      omitDefaultHeaders,
      omitDefaultResponses,
      defaultResponse,
    }: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels> = {},
  ) {
    this.requestBody = requestBody
    this.headers = headers
    this.many = many
    this.query = query
    this.responses = responses
    this.serializerKey = serializerKey
    this.status = status
    this.tags = tags
    this.pathParams = pathParams
    this.summary = summary
    this.description = description
    this.nullable = nullable
    this.omitDefaultHeaders = omitDefaultHeaders
    this.omitDefaultResponses = omitDefaultResponses
    this.defaultResponse = defaultResponse
  }

  /**
   * @internal
   *
   * Each Endpoint renderer contains both path and schema data
   * for the respective endpoint. The OpenapiAppRenderer#toObject method
   * examines each controller, scanning for @OpenAPI decorator calls,
   * each of which instantiates a new OpenapiEndpointRenderer. The
   * OpenapiAppRenderer#toObject will call both `#toPathObject` AND
   * `#toSchemaObject`, combining them both into part of the final
   * Openapi output.
   *
   * `#toPathObject` specifically builds the `paths` portion of the
   * final openapi.json output
   */
  public async toPathObject(processedSchemas: Record<string, boolean>): Promise<OpenapiEndpointResponse> {
    this.serializers = DreamApplication.getOrFail().serializers

    const [path, method, requestBody, responses] = await Promise.all([
      this.computedPath(),
      this.computedMethod(),
      this.computedRequestBody(processedSchemas),
      this.parseResponses(processedSchemas),
    ])

    const output = {
      [path]: {
        parameters: [...this.headersArray(), ...(await this.pathParamsArray()), ...this.queryArray()],
        [method]: {
          tags: this.tags || [],
        },
      },
    } as unknown as OpenapiEndpointResponse

    if (this.summary) {
      output[path][method].summary = this.summary
    }

    if (this.description) {
      output[path][method].description = this.description
    }

    if (requestBody) {
      output[path][method]['requestBody'] = requestBody
    }

    output[path][method].responses = responses

    return output
  }

  /**
   * @internal
   *
   * Each Endpoint renderer contains both path and schema data
   * for the respective endpoint. The OpenapiAppRenderer#toObject method
   * examines each controller, scanning for @OpenAPI decorator calls,
   * each of which instantiates a new OpenapiEndpointRenderer. The
   * OpenapiAppRenderer#toObject will call both `#toPathObject` AND
   * `#toSchemaObject`, combining them both into part of the final
   * Openapi output.
   *
   * `#toSchemaObject` specifically builds the `components.schema` portion of the
   * final openapi.json output, adding any relevant entries that were uncovered
   * while parsing the responses and provided callback function.
   */
  public toSchemaObject(processedSchemas: Record<string, boolean>): Record<string, OpenapiSchemaBody> {
    this.computedExtraComponents = {}

    this.serializers = DreamApplication.getOrFail().serializers
    const serializerClasses = this.getSerializerClasses()

    let output: Record<string, OpenapiSchemaBody> = {}

    ;(serializerClasses || ([] as (typeof DreamSerializer)[])).forEach(serializerClass => {
      output = {
        ...output,
        ...new OpenapiSerializerRenderer({
          serializerClass,
          schemaDelimeter: this.schemaDelimeter,
          serializers: this.serializers,
          processedSchemas,
          target: 'response',
        }).parse(),
      }
    })

    // run this to extract all $serializer refs from responses object
    // and put them into the computedExtraComponents field
    this.parseResponses(processedSchemas)

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

    const extraPathParamDetails: OpenapiPathParams = this.pathParams || {}

    const route = await this.getCurrentRouteConfig()
    const pathSegments = route.path
      .split('/')
      .filter(pathSegment => /^:/.test(pathSegment))
      .map(field => {
        const sanitizedField = field.replace(/^:/, '')
        const extraPathParamDetailsForThisParam = extraPathParamDetails[sanitizedField]?.description

        return {
          in: 'path',
          name: sanitizedField,
          required: true,
          description: extraPathParamDetailsForThisParam || sanitizedField,
          schema: {
            type: 'string',
          },
        }
      })

    this._pathParams = pathSegments as OpenapiParameterResponse[]

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
    const controllerActionString = this.controllerClass.controllerActionPath(this.action)

    // if the action is update, we want to specifically find the 'patch' route,
    // otherwise we find any route that matches
    let route =
      this.action === 'update'
        ? this.routes.find(
            routeConfig =>
              routeConfig.controllerActionString === controllerActionString &&
              routeConfig.httpMethod === 'patch',
          )
        : this.routes.find(routeConfig => routeConfig.controllerActionString === controllerActionString)

    if (!route)
      route = this.routes.find(routeConfig => routeConfig.controllerActionString === controllerActionString)

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
    const psychicApp = PsychicApplication.getOrFail()

    const defaultHeaders = this.omitDefaultHeaders ? {} : psychicApp.openapi?.defaults?.headers || {}
    const headers = { ...defaultHeaders, ...(this.headers || []) } as OpenapiHeaders

    return (
      Object.keys(headers).map((headerName: string) => {
        const header = headers[headerName]
        const data = {
          in: 'header',
          name: headerName,
          required: header.required,
          description: header.description || headerName,
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
      Object.keys(this.query || ({} as OpenapiQueries)).map((queryName: string) => {
        const queryParam = this.query![queryName]
        const output = {
          in: 'query',
          name: queryName,
          description: queryParam.description || queryName,
          ...queryParam,
          schema: {
            type: 'string',
          },
        } as OpenapiParameterResponse

        if (typeof queryParam.allowEmptyValue === 'boolean') {
          output.allowEmptyValue = queryParam.allowEmptyValue
        }

        if (typeof queryParam.allowReserved === 'boolean') {
          output.allowReserved = queryParam.allowReserved
        }

        return output
      }) || []
    )
  }

  /**
   * @internal
   *
   * Generates the requestBody portion of the endpoint
   */
  private async computedRequestBody(
    processedSchemas: Record<string, boolean>,
  ): Promise<OpenapiContent | undefined> {
    const method = await this.computedMethod()
    if (this.requestBody === null) return undefined

    const httpMethodsThatAllowBody: HttpMethod[] = ['post', 'patch', 'put']
    if (!httpMethodsThatAllowBody.includes(method)) return undefined

    if (this.shouldAutogenerateBody()) {
      return this.generateRequestBodyForModel(processedSchemas)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = this.recursivelyParseBody(
      this.requestBody as OpenapiSchemaBodyShorthand,
      processedSchemas,
      {
        target: 'request',
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any

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
   * determine if the requestBody is meant to identify a special shape
   * used when requestBody is proxying off of the model CB. In these cases,
   * an object with "only" and "required" fields can be passed.
   *
   * This method returns true if it detects that this is the case.
   */
  private shouldAutogenerateBody() {
    const body = this.requestBody as OpenapiSchemaRequestBodyOnlyOption
    if (!body) return true
    if (body.only) return true
    if (body.for) return true
    if (body.required && (body as OpenapiSchemaObject).type !== 'object') return true
    return false
  }

  /**
   * @internal
   *
   * Generates a request body by examining the provided model callback.
   * If the callback returns a single model, then all of the params for
   * that model that are safe to ingest will be automatically added to
   * the request body.
   */
  private generateRequestBodyForModel(processedSchemas: Record<string, boolean>): OpenapiContent | undefined {
    const forDreamClass = (this.requestBody as OpenapiSchemaRequestBodyOnlyOption)?.for
    const dreamClass = forDreamClass || this.getSingleDreamModelClass()
    if (!dreamClass) return undefined

    let paramSafeColumns = dreamClass.paramSafeColumnsOrFallback()
    const only = (this.requestBody as OpenapiSchemaRequestBodyOnlyOption)?.only
    if (only) {
      paramSafeColumns = paramSafeColumns.filter(column => only.includes(column))
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = dreamClass.prototype.schema

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const columns = schema[dreamClass.prototype.table]?.columns as object

    const paramsShape: OpenapiSchemaObject = {
      type: 'object',
      properties: {},
    }

    const required = (this.requestBody as OpenapiSchemaRequestBodyOnlyOption)?.required
    if (required) {
      paramsShape.required = required
    }

    for (const columnName of paramSafeColumns) {
      const columnMetadata = columns[columnName] as {
        dbType: string
        allowNull: boolean
        isArray: boolean
        enumValues: unknown[] | null
      }

      switch (columnMetadata?.dbType) {
        case 'boolean':
        case 'boolean[]':
        case 'date':
        case 'date[]':
        case 'integer':
        case 'integer[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: columnMetadata.dbType,
            },
          }
          break

        case 'character varying':
        case 'citext':
        case 'text':
        case 'uuid':
        case 'bigint':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'string',
            },
          }
          break

        case 'character varying[]':
        case 'citext[]':
        case 'text[]':
        case 'uuid[]':
        case 'bigint[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          }
          break

        case 'timestamp':
        case 'timestamp with time zone':
        case 'timestamp without time zone':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'date-time',
            },
          }
          break

        case 'timestamp[]':
        case 'timestamp with time zone[]':
        case 'timestamp without time zone[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'array',
              items: {
                type: 'date-time',
              },
            },
          }
          break

        case 'json':
        case 'jsonb':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'object',
            },
          }
          break

        case 'json[]':
        case 'jsonb[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          }
          break

        case 'numeric':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'number',
            },
          }
          break

        case 'numeric[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: 'array',
              items: {
                type: 'number',
              },
            },
          }
          break

        default:
          if (dreamClass.isVirtualColumn(columnName as string)) {
            const metadata = dreamClass['virtualAttributes'].find(
              statement => statement.property === columnName,
            )
            if (metadata?.type) {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: this.recursivelyParseBody(metadata.type, processedSchemas, {
                  target: 'request',
                }),
              }
            } else {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  anyOf: [
                    { type: 'string', nullable: true },
                    { type: 'number', nullable: true },
                    { type: 'object', nullable: true },
                  ],
                },
              }
            }
          } else if (columnMetadata?.enumValues) {
            if (columnMetadata.isArray) {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: columnMetadata.enumValues,
                  },
                },
              }
            } else {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  type: 'string',
                  enum: columnMetadata.enumValues,
                },
              }
            }
          }
      }

      if (columnMetadata?.allowNull && paramsShape.properties![columnName]) {
        ;(paramsShape.properties![columnName] as OpenapiSchemaObject).nullable = true
      }
    }

    return {
      content: {
        'application/json': {
          schema: this.recursivelyParseBody(paramsShape, processedSchemas, { target: 'request' }),
        },
      },
    }
  }

  /**
   * @internal
   *
   * Generates the responses portion of the endpoint
   */
  private parseResponses(processedSchemas: Record<string, boolean>): OpenapiResponses {
    const psychicApp = PsychicApplication.getOrFail()

    const defaultResponses = this.omitDefaultResponses ? {} : psychicApp.openapi?.defaults?.responses || {}
    let responseData: OpenapiResponses = {
      ...DEFAULT_OPENAPI_RESPONSES,
      ...defaultResponses,
    }

    const computedStatus: HttpStatusCodeNumber = this.status || this.defaultStatus

    if (this.status === 204) {
      responseData = {
        ...responseData,
        204: {
          description: this.defaultResponseDescription(computedStatus),
          $ref: '#/components/responses/NoContent',
        },
      }
    } else if (!this.responses?.['200'] && !this.responses?.['201'] && !this.responses?.['204']) {
      responseData = {
        ...responseData,
        [computedStatus]: {
          ...this.parseSerializerResponseShape(),
          description: this.defaultResponseDescription(computedStatus),
        },
      }
    }

    Object.keys(this.responses || {}).forEach(statusCode => {
      const statusCodeInt: HttpStatusCodeNumber = parseInt(statusCode) as HttpStatusCodeNumber
      const response = this.responses![statusCodeInt] as OpenapiSchemaBodyShorthand & { description?: string }
      responseData[statusCodeInt] ||= { description: statusDescription(statusCodeInt) } as OpenapiContent
      const statusResponse: OpenapiContent = responseData[statusCodeInt] as OpenapiContent

      statusResponse.content = {
        'application/json': {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          schema: this.recursivelyParseBody(
            response,
            processedSchemas,
            { target: 'response' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ) as any,
        },
      }
    })

    return responseData
  }

  private defaultResponseDescription(statusCodeInt: HttpStatusCodeNumber) {
    return this.defaultResponse?.description || statusDescription(statusCodeInt)
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
    const serializerKey = serializerClass.openapiName

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
      const serializerKey = serializerClass.openapiName

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
    const psychicApp = PsychicApplication.getOrFail()
    return psychicApp.openapi?.schemaDelimeter || ''
  }

  /**
   * @internal
   *
   * recursive function used to parse nested
   * openapi shorthand objects
   */
  private recursivelyParseBody(
    bodySegment: OpenapiBodySegment,
    processedSchemas: Record<string, boolean>,
    { target }: { target: 'request' | 'response' },
  ): OpenapiSchemaBody {
    const { results, extraComponents } = new OpenapiBodySegmentRenderer({
      bodySegment,
      serializers: this.serializers,
      schemaDelimeter: this.schemaDelimeter,
      processedSchemas,
      target,
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
    if (!this.dreamsOrSerializers) return null

    if (Array.isArray(this.dreamsOrSerializers)) {
      return compact(this.dreamsOrSerializers.map(s => this.getSerializerClass(s)))
    } else {
      return compact([this.getSerializerClass(this.dreamsOrSerializers)])
    }
  }

  /**
   * @internal
   *
   * Returns the dream model provided to the callback function.
   * If the callback function does not return a single dream model,
   * then this method will return null.
   */
  private getSingleDreamModelClass(): typeof Dream | null {
    if (!this.dreamsOrSerializers) return null
    if (Array.isArray(this.dreamsOrSerializers)) return null

    if ((this.dreamsOrSerializers as unknown as typeof Dream)?.isDream) {
      return this.dreamsOrSerializers as unknown as typeof Dream
    }

    return null
  }

  /**
   * @internal
   *
   * Uses the provided entity to resolve to a serializer class.
   */
  private getSerializerClass(
    dreamOrSerializerOrViewModel: SerializableDreamClassOrViewModelClass | typeof DreamSerializer,
  ): typeof DreamSerializer {
    const dreamApp = DreamApplication.getOrFail()
    if ((dreamOrSerializerOrViewModel as typeof DreamSerializer).isDreamSerializer) {
      return dreamOrSerializerOrViewModel as typeof DreamSerializer
    } else {
      const modelClass = dreamOrSerializerOrViewModel as SerializableDreamClassOrViewModelClass
      const modelPrototype = modelClass.prototype as SerializableDreamOrViewModel
      const serializerKey =
        modelPrototype.serializers[
          (this.serializerKey || 'default') as keyof typeof modelPrototype.serializers
        ]
      return dreamApp.serializers[serializerKey] || null
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
  T extends
    | SerializableDreamClassOrViewModelClass
    | SerializableDreamClassOrViewModelClass[]
    | typeof DreamSerializer
    | (typeof DreamSerializer)[],
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
  pathParams?: OpenapiPathParams
  headers?: OpenapiHeaders
  query?: OpenapiQueries
  requestBody?: OpenapiSchemaBodyShorthand | OpenapiSchemaRequestBodyOnlyOption | null
  tags?: string[]
  description?: string
  summary?: string
  responses?: Partial<
    Record<HttpStatusCode, (OpenapiSchemaBodyShorthand & { description?: string }) | { description: string }>
  >
  defaultResponse?: OpenapiEndpointRendererDefaultResponseOption
  serializerKey?: InstanceType<NonArrayT> extends { serializers: { [key: string]: typeof DreamSerializer } }
    ? keyof InstanceType<NonArrayT>['serializers' & keyof InstanceType<NonArrayT>]
    : undefined
  status?: HttpStatusCodeNumber
  nullable?: boolean
  omitDefaultHeaders?: boolean
  omitDefaultResponses?: boolean
}

export interface OpenapiEndpointRendererDefaultResponseOption {
  description?: string
}

export interface OpenapiSchemaRequestBodyOnlyOption {
  for?: typeof Dream
  only?: string[]
  required?: string[]
}

export interface OpenapiHeaderOption {
  required: boolean
  description?: string
  format?: 'date' | 'date-time'
}

export type OpenapiHeaders = Record<string, OpenapiHeaderOption>

export interface OpenapiQueryOption {
  required: boolean
  description?: string
  allowReserved?: boolean
  allowEmptyValue?: boolean
}

export type OpenapiQueries = Record<string, OpenapiQueryOption>

export interface OpenapiPathParamOption {
  description?: string
}

export type OpenapiPathParams = Record<string, OpenapiPathParamOption>

export interface OpenapiSchema {
  openapi: `${number}.${number}.${number}`
  info: {
    version: string
    title: string
    description: string
  }
  paths: OpenapiEndpointResponse
  components: {
    [key: string]: {
      [key: string]: OpenapiSchemaBody | OpenapiContent
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
  allowReserved?: boolean
  allowEmptyValue?: boolean
}

export type OpenapiHeaderType = 'header' | 'body' | 'path' | 'query'

export type OpenapiMethodResponse = {
  [method in HttpMethod]: OpenapiMethodBody
}

export interface OpenapiMethodBody {
  tags: string[]
  summary: string
  description: string
  requestBody: OpenapiContent
  responses: OpenapiResponses
}

export interface OpenapiResponses {
  summary?: string
  description?: string
  [statusCode: number]: OpenapiContent | OpenapiSchemaExpressionRef | { description: string }
}

export type OpenapiContent = {
  content?: {
    [format in OpenapiFormats]: {
      schema:
        | {
            type: OpenapiAllTypes
            properties?: OpenapiSchemaProperties
            required?: string[]
          }
        | OpenapiSchemaObject
        | OpenapiSchemaArray
        | OpenapiSchemaExpressionRef
        | OpenapiSchemaExpressionAnyOf
        | OpenapiSchemaExpressionAllOf
        | OpenapiSchemaExpressionOneOf
    }
  }
  description?: string
}

function statusDescription(status: HttpStatusCodeNumber | HttpStatusCode) {
  switch (status) {
    case 200:
    case '200':
      return 'Success'

    case 201:
    case '201':
      return 'Created'

    case 202:
    case '202':
      return 'Accepted'

    case 203:
    case '203':
      return 'Non authoritative information'

    case 204:
    case '204':
      return 'Success, no content'

    case 205:
    case '205':
      return 'Reset content'

    case 206:
    case '206':
      return 'Partial content'

    case 301:
    case '301':
      return 'Moved permanently'

    case 302:
    case '302':
      return 'Found'

    case 304:
    case '304':
      return 'Not modified'

    case 400:
    case '400':
      return 'Bad request'

    case 401:
    case '401':
      return 'Unauthorized'

    case 402:
    case '402':
      return 'Payment required'

    case 403:
    case '403':
      return 'Forbidden'

    case 404:
    case '404':
      return 'Not found'

    case 408:
    case '408':
      return 'Request timeout'

    case 409:
    case '409':
      return 'Conflict'

    case 412:
    case '412':
      return 'Precondition failed'

    case 413:
    case '413':
      return 'Payload too large'

    case 415:
    case '415':
      return 'Unsupported media type'

    case 422:
    case '422':
      return 'Unprocessable entity'

    case 423:
    case '423':
      return 'Locked'

    case 424:
    case '424':
      return 'Failed dependency'

    case 426:
    case '426':
      return 'Upgrade required'

    case 428:
    case '428':
      return 'Precondition required'

    case 429:
    case '429':
      return 'Too many requests'

    case 451:
    case '451':
      return 'Unavailable for legal reasons'

    default:
      return `Status ${status}`
  }
}
