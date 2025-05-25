import {
  Dream,
  DreamModelSerializerType,
  DreamOrViewModelClassSerializerArrayKeys,
  DreamOrViewModelClassSerializerKey,
  DreamSerializable,
  DreamSerializableArray,
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
  SerializerCasing,
  SerializerOpenapiRenderer,
  SimpleModelSerializerType,
  ViewModelClass,
  ViewModelSerializerType,
  compact,
  inferSerializersFromDreamClassOrViewModelClass,
  isDreamSerializer,
  sortBy,
} from '@rvoh/dream'
import { cloneDeep } from 'lodash-es'
import PsychicController from '../controller/index.js'
import { HttpStatusCode, HttpStatusCodeNumber } from '../error/http/status-codes.js'
import OpenApiFailedToLookupSerializerForEndpoint from '../error/openapi/FailedToLookupSerializerForEndpoint.js'
import { RouteConfig } from '../router/route-manager.js'
import { HttpMethod } from '../router/types.js'
import OpenapiBodySegmentRenderer, { OpenapiBodySegment, OpenapiBodyTarget } from './body-segment.js'
import { DEFAULT_OPENAPI_RESPONSES } from './defaults.js'
import openapiOpts from './helpers/openapiOpts.js'
import openapiRoute from './helpers/openapiRoute.js'
import openapiPageParamProperty from './helpers/pageParamOpenapiProperty.js'
import primitiveOpenapiStatementToOpenapi from './helpers/primitiveOpenapiStatementToOpenapi.js'
import safelyAttachPaginationParamToRequestBodySegment from './helpers/safelyAttachPaginationParamsToBodySegment.js'
import schemaDelimiter from './helpers/schemaDelimiter.js'

export default class OpenapiEndpointRenderer<
  DreamsOrSerializersOrViewModels extends DreamSerializable | DreamSerializableArray,
> {
  private many: OpenapiEndpointRendererOpts['many']
  private paginate: OpenapiEndpointRendererOpts['paginate']
  private responses: OpenapiEndpointRendererOpts['responses']
  private serializerKey: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels>['serializerKey']
  private pathParams: OpenapiEndpointRendererOpts['pathParams']
  private requestBody: OpenapiEndpointRendererOpts['requestBody']
  private headers: OpenapiEndpointRendererOpts['headers']
  private query: OpenapiEndpointRendererOpts['query']
  private status: OpenapiEndpointRendererOpts['status']
  private tags: OpenapiEndpointRendererOpts['tags']
  private security: OpenapiEndpointRendererOpts['security']
  private summary: OpenapiEndpointRendererOpts['summary']
  private description: OpenapiEndpointRendererOpts['description']
  private omitDefaultHeaders: OpenapiEndpointRendererOpts['omitDefaultHeaders']
  private omitDefaultResponses: OpenapiEndpointRendererOpts['omitDefaultResponses']
  private defaultResponse: OpenapiEndpointRendererOpts['defaultResponse']

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
      paginate,
      query,
      responses,
      serializerKey,
      status,
      tags,
      security,
      pathParams,
      description,
      summary,
      omitDefaultHeaders,
      omitDefaultResponses,
      defaultResponse,
    }: OpenapiEndpointRendererOpts<DreamsOrSerializersOrViewModels> = {},
  ) {
    this.requestBody = requestBody
    this.headers = headers
    this.many = many
    this.paginate = paginate
    this.query = query
    this.responses = responses
    this.serializerKey = serializerKey
    this.status = status
    this.security = security
    this.pathParams = pathParams
    this.summary = summary
    this.description = description
    this.tags = tags === undefined ? controllerClass.openapiConfig?.tags || [] : tags
    this.omitDefaultHeaders =
      omitDefaultHeaders === undefined
        ? controllerClass.openapiConfig?.omitDefaultHeaders || false
        : omitDefaultHeaders
    this.omitDefaultResponses =
      omitDefaultResponses === undefined
        ? controllerClass.openapiConfig?.omitDefaultResponses || false
        : omitDefaultResponses
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
  public toPathObject(
    processedSchemas: Record<string, boolean>,
    routes: RouteConfig[],
    opts: {
      openapiName: string
      casing: SerializerCasing
      schemaDelimiter: string
      suppressResponseEnums: boolean
    },
  ): OpenapiEndpointResponse {
    const path = this.computedPath(routes)
    const method = this.computedMethod(routes)
    const requestBody = this.computedRequestBody(processedSchemas, routes, opts)
    const responses = this.parseResponses(processedSchemas, opts)

    const output = {
      [path]: {
        parameters: [...this.headersArray(opts), ...this.pathParamsArray(routes), ...this.queryArray(opts)],
        [method]: {
          tags: this.tags || [],
        },
      },
    } as unknown as OpenapiEndpointResponse

    const outputPath = output[path]
    if (outputPath === undefined) throw new Error(`no output for path ${path}`)

    if (this.summary) {
      outputPath[method].summary = this.summary
    }

    if (this.description) {
      outputPath[method].description = this.description
    }

    if (this.security) {
      outputPath[method].security = this.security
    }

    if (requestBody) {
      outputPath[method]['requestBody'] = requestBody
    }

    outputPath[method].responses = responses

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
  public toSchemaObject(opts: {
    openapiName: string
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
    processedSchemas: Record<string, boolean>
  }): {
    processedSchemas: Record<string, boolean>
    renderedSchemas: Record<string, OpenapiSchemaBody>
  } {
    const serializers =
      this.getSerializerClasses() ??
      ([] as (DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType)[])

    return serializersToSchemaObjects(serializers, opts)
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
  private computedMethod(routes: RouteConfig[]): HttpMethod {
    const route = this.getCurrentRouteConfig(routes)
    return route.httpMethod
  }

  /**
   * @internal
   *
   * Generates the path portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
  private pathParamsArray(routes: RouteConfig[]): OpenapiParameterResponse[] {
    if (this._pathParams) return this._pathParams

    const extraPathParamDetails: OpenapiPathParams = this.pathParams || {}

    const route = this.getCurrentRouteConfig(routes)
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
          description: extraPathParamDetailsForThisParam,
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
  private computedPath(routes: RouteConfig[]) {
    const route = this.getCurrentRouteConfig(routes)
    return openapiRoute(route.path)
  }

  /**
   * @internal
   *
   * find and memoize the route corresponding to this controller.
   * If no match is found, a MissingControllerActionPairingInRoutes exception.
   */
  private getCurrentRouteConfig(routes: RouteConfig[]) {
    // if the action is update, we want to specifically find the 'patch' route,
    // otherwise we find any route that matches
    const filteredRoutes = routes.filter(
      routeConfig => routeConfig.controller === this.controllerClass && routeConfig.action === this.action,
    )

    const route =
      this.action === 'update'
        ? filteredRoutes.find(routeConfig => routeConfig.httpMethod === 'patch')
        : filteredRoutes.at(0)

    if (!route) throw new MissingControllerActionPairingInRoutes(this.controllerClass, this.action)
    return route
  }

  /**
   * @internal
   *
   * Generates the header portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
  private headersArray(opts: {
    openapiName: string
    casing: SerializerCasing
    suppressResponseEnums: boolean
  }): OpenapiParameterResponse[] {
    const defaultHeaders = this.omitDefaultHeaders
      ? {}
      : openapiOpts(opts.openapiName)?.defaults?.headers || {}
    const headers = { ...defaultHeaders, ...(this.headers || []) } as OpenapiHeaders

    return (
      compact(
        Object.keys(headers).map((headerName: string) => {
          const header = headers[headerName]
          if (header === undefined) return null

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
        }),
      ) || []
    )
  }

  /**
   * @internal
   *
   * Generates the header portion of the openapi payload's
   * "parameters" field for a single endpoint.
   */
  private queryArray(opts: {
    openapiName: string
    casing: SerializerCasing
    suppressResponseEnums: boolean
  }): OpenapiParameterResponse[] {
    const queryParams =
      Object.keys(this.query || ({} as OpenapiQueries)).map((queryName: string) => {
        const queryParam = this.query![queryName]
        let output = {
          in: 'query',
          name: queryName,
          description: queryParam?.description || queryName,
          allowReserved: true,
          ...queryParam,
          schema: {
            type: 'string',
          },
        } as OpenapiParameterResponse

        if (typeof queryParam?.allowEmptyValue === 'boolean') {
          output.allowEmptyValue = queryParam.allowEmptyValue
        }

        if (typeof queryParam?.allowReserved === 'boolean') {
          output.allowReserved = queryParam.allowReserved
        }

        if (queryParam?.schema) {
          output = {
            ...output,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            schema: recursivelyTranslateShorthandIntoOpenapi(
              queryParam.schema,
              { ...opts, target: 'request' },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ) as any,
          }
        }

        return output
      }) || []

    const paginationName = (this.paginate as { query?: string })?.query
    if (paginationName) {
      queryParams.push({
        in: 'query',
        required: false,
        name: paginationName,
        description: 'Page number',
        allowReserved: true,
        schema: {
          type: 'string',
        },
      })
    }

    return queryParams
  }

  /**
   * @internal
   *
   * Generates the requestBody portion of the endpoint
   */
  private computedRequestBody(
    processedSchemas: Record<string, boolean>,
    routes: RouteConfig[],
    opts: {
      openapiName: string
      casing: SerializerCasing
      suppressResponseEnums: boolean
    },
  ): OpenapiContent | undefined {
    const method = this.computedMethod(routes)
    if (this.requestBody === null) return this.defaultRequestBody()

    const httpMethodsThatAllowBody: HttpMethod[] = ['post', 'patch', 'put']
    if (!httpMethodsThatAllowBody.includes(method)) return this.defaultRequestBody()

    if (this.shouldAutogenerateBody()) {
      return this.generateRequestBodyForModel(opts)
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let schema = recursivelyTranslateShorthandIntoOpenapi(
      this.requestBody as OpenapiSchemaBodyShorthand,
      { ...opts, target: 'request' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any

    const bodyPageParam = (this.paginate as { body: string })?.body
    if (bodyPageParam) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      schema = safelyAttachPaginationParamToRequestBodySegment(bodyPageParam, schema)
    }

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

  private defaultRequestBody(): OpenapiContent | undefined {
    const bodyPageParam = (this.paginate as { body: string })?.body
    if (bodyPageParam) {
      return {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                [bodyPageParam]: openapiPageParamProperty(),
              },
            },
          },
        },
      }
    }

    return undefined
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
  private generateRequestBodyForModel(opts: {
    openapiName: string
    casing: SerializerCasing
    suppressResponseEnums: boolean
  }): OpenapiContent | undefined {
    const forDreamClass = (this.requestBody as OpenapiSchemaRequestBodyOnlyOption)?.for
    const dreamClass = forDreamClass || this.getSingleDreamModelClass()
    if (!dreamClass) return this.defaultRequestBody()

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

      const nullableColumn = columnMetadata?.allowNull

      switch (columnMetadata?.dbType) {
        case 'boolean':
        case 'boolean[]':
        case 'date':
        case 'date[]':
        case 'integer':
        case 'integer[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi(columnMetadata.dbType, nullableColumn),
          }
          break

        case 'character varying':
        case 'citext':
        case 'text':
        case 'uuid':
        case 'bigint':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('string', nullableColumn),
          }
          break

        case 'character varying[]':
        case 'citext[]':
        case 'text[]':
        case 'uuid[]':
        case 'bigint[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('string[]', nullableColumn),
          }
          break

        case 'timestamp':
        case 'timestamp with time zone':
        case 'timestamp without time zone':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('date-time', nullableColumn),
          }
          break

        case 'timestamp[]':
        case 'timestamp with time zone[]':
        case 'timestamp without time zone[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('date-time[]', nullableColumn),
          }
          break

        case 'json':
        case 'jsonb':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: nullableColumn ? ['object', 'null'] : 'object',
            },
          }
          break

        case 'json[]':
        case 'jsonb[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: {
              type: nullableColumn ? ['array', 'null'] : 'array',
              items: {
                type: 'object',
              },
            },
          }
          break

        case 'numeric':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('number', nullableColumn),
          }
          break

        case 'numeric[]':
          paramsShape.properties = {
            ...paramsShape.properties,
            [columnName]: primitiveOpenapiStatementToOpenapi('number[]', nullableColumn),
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
                [columnName]: recursivelyTranslateShorthandIntoOpenapi(metadata.type, {
                  ...opts,
                  target: 'request',
                }),
              }
            } else {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  anyOf: [
                    { type: ['string', 'null'] },
                    { type: ['number', 'null'] },
                    { type: ['object', 'null'] },
                  ],
                },
              }
            }
          } else if (columnMetadata?.enumValues) {
            if (columnMetadata.isArray) {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  type: nullableColumn ? ['array', 'null'] : 'array',
                  items: {
                    type: 'string',
                    enum: [...columnMetadata.enumValues, ...(nullableColumn ? [null] : [])],
                  },
                },
              }
            } else {
              paramsShape.properties = {
                ...paramsShape.properties,
                [columnName]: {
                  type: nullableColumn ? ['string', 'null'] : 'string',
                  enum: [...columnMetadata.enumValues, ...(nullableColumn ? [null] : [])],
                },
              }
            }
          }
      }
    }

    let processedSchema = recursivelyTranslateShorthandIntoOpenapi(paramsShape, {
      ...opts,
      target: 'request',
    })

    const bodyPageParam = (this.paginate as { body: string })?.body
    if (bodyPageParam) {
      processedSchema = safelyAttachPaginationParamToRequestBodySegment(bodyPageParam, processedSchema)
    }

    return {
      content: {
        'application/json': {
          schema: processedSchema,
        },
      },
    }
  }

  /**
   * @internal
   *
   * Generates the responses portion of the endpoint
   */
  private parseResponses(
    processedSchemas: Record<string, boolean>,
    opts: {
      openapiName: string
      casing: SerializerCasing
      schemaDelimiter: string
      suppressResponseEnums: boolean
    },
  ): OpenapiResponses {
    let responseData: OpenapiResponses = {}

    const computedStatus: HttpStatusCodeNumber = this.status || this.defaultStatus

    if (this.status === 204) {
      responseData = {
        204: {
          description: this.defaultResponseDescription(computedStatus),
          $ref: '#/components/responses/NoContent',
        },
      }
    } else if (!this.responses?.['200'] && !this.responses?.['201'] && !this.responses?.['204']) {
      responseData = {
        [computedStatus]: {
          ...this.parseSerializerResponseShape({ schemaDelimiter: opts.schemaDelimiter }),
          description: this.defaultResponseDescription(computedStatus),
        },
      }
    }

    Object.keys(this.responses || {}).forEach(statusCode => {
      const statusCodeInt: HttpStatusCodeNumber = parseInt(statusCode) as HttpStatusCodeNumber
      const response = cloneDeep(
        this.responses![statusCodeInt] as OpenapiSchemaBodyShorthand & { description?: string },
      )
      responseData[statusCodeInt] ||= { description: statusDescription(statusCodeInt) } as OpenapiContent
      const statusResponse: OpenapiContent = responseData[statusCodeInt] as OpenapiContent

      statusResponse.content = {
        'application/json': {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          schema: recursivelyTranslateShorthandIntoOpenapi(response, {
            ...opts,
            target: 'response',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          }) as any,
        },
      }
    })

    const defaultResponses = this.omitDefaultResponses
      ? {}
      : openapiOpts(opts.openapiName)?.defaults?.responses || {}

    const psychicAndConfigLevelDefaults = this.omitDefaultResponses
      ? {}
      : cloneDeep({
          ...DEFAULT_OPENAPI_RESPONSES,
          ...defaultResponses,
        })

    Object.keys(psychicAndConfigLevelDefaults).forEach(key => {
      if (!responseData[key as keyof typeof responseData]) {
        const data = psychicAndConfigLevelDefaults[key as keyof typeof psychicAndConfigLevelDefaults]

        switch (key) {
          case 'summary':
          case 'description':
            responseData[key] = data as string
            break
          default:
            responseData[key as unknown as number] = data as
              | OpenapiContent
              | OpenapiSchemaExpressionRef
              | { description: string }
        }
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
  private parseSerializerResponseShape({
    schemaDelimiter,
  }: {
    schemaDelimiter: string
  }): OpenapiContent | { description: string } {
    const serializerClasses = this.getSerializerClasses()
    if (!serializerClasses) return { description: 'no content' }

    if (serializerClasses.length > 1) {
      return this.parseMultiEntitySerializerResponseShape(serializerClasses, { schemaDelimiter })
    }

    return this.parseSingleEntitySerializerResponseShape(serializerClasses[0]!, { schemaDelimiter })
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
  private parseSingleEntitySerializerResponseShape(
    serializer: DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType,
    { schemaDelimiter }: { schemaDelimiter: string },
  ): OpenapiContent {
    if (serializer === undefined) {
      throw new OpenApiFailedToLookupSerializerForEndpoint(this.controllerClass, this.action)
    }

    const finalOutput: OpenapiContent = {
      content: {
        'application/json': {
          schema: new SerializerOpenapiRenderer(serializer, { schemaDelimiter }).serializerRef,
        },
      },
      description: this.description || this.action,
    }

    return finalOutput
  }

  /**
   * @internal
   *
   * takes a base serializer object (i.e. { $ref: '#/components/schemas/MySerializer' })
   * and transforms it based on the openapi renderer options.
   *
   * if many, it will return an array of this serializer object.
   * if paginate, it will return a pagination object with an array of this serializer object
   * if defaultResponse.maybeNull is set, it will optionally return null as well (only for non-many and non-paginate cases)
   */
  private baseSchemaForSerializerObject(serializerObject: OpenapiSchemaBody) {
    if (this.paginate)
      return {
        type: 'object',
        required: ['recordCount', 'pageCount', 'currentPage', 'results'],
        properties: {
          recordCount: {
            type: 'number',
          },
          pageCount: {
            type: 'number',
          },
          currentPage: {
            type: 'number',
          },
          results: {
            type: 'array',
            items: serializerObject,
          },
        },
      }

    if (this.many)
      return {
        type: 'array',
        items: serializerObject,
      }

    if (this.defaultResponse?.maybeNull) return { anyOf: [serializerObject, { type: 'null' }] }

    return serializerObject
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
  private parseMultiEntitySerializerResponseShape(
    serializers: (DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType)[],
    { schemaDelimiter }: { schemaDelimiter: string },
  ): OpenapiContent {
    const anyOf: OpenapiSchemaExpressionAnyOf = { anyOf: [] }

    const sortedSerializerClasses = sortBy(
      serializers,
      serializer => new SerializerOpenapiRenderer(serializer, { schemaDelimiter }).openapiName,
    )

    sortedSerializerClasses.forEach(serializer => {
      anyOf.anyOf.push(new SerializerOpenapiRenderer(serializer, { schemaDelimiter }).serializerRef)
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          schema: baseSchema as any,
        },
      },
    }

    return finalOutput
  }

  /**
   * @internal
   *
   * Returns the serializer class either attached directly
   * to this OpenapiEndpointRenderer, or else travels through the
   * attached dream or view model to identify a serializer
   * match.
   */

  private getSerializerClasses():
    | (DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType)[]
    | null {
    if (!this.dreamsOrSerializers) return null

    const results = compact(
      [this.dreamsOrSerializers]
        .flat()
        .map(s => this.getSerializerClass(s))
        .flat(),
    )

    return results
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
    dreamOrSerializerOrViewModel:
      | typeof Dream
      | ViewModelClass
      | DreamModelSerializerType
      | ViewModelSerializerType
      | SimpleModelSerializerType,
  ): (DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType)[] {
    if (isDreamSerializer(dreamOrSerializerOrViewModel)) {
      return [dreamOrSerializerOrViewModel] as (
        | DreamModelSerializerType
        | ViewModelSerializerType
        | SimpleModelSerializerType
      )[]
    }

    return inferSerializersFromDreamClassOrViewModelClass(
      dreamOrSerializerOrViewModel as typeof Dream | ViewModelClass,
      this.serializerKey,
    )
  }
}

export class MissingControllerActionPairingInRoutes extends Error {
  constructor(
    private controllerClass: typeof PsychicController,
    private action: string,
  ) {
    super()
  }
  public override get message() {
    return `
OpenAPI decorator has been applied to method '${this.action}' in '${this.controllerClass.name}',
but no route maps to this method in your conf/routes.ts file.

Either remove the @OpenAPI decorator for '${this.action}', or add a route to the
routes file which will direct to this controller class and method.`
  }
}

export interface OpenapiEndpointRendererOpts<
  I extends DreamSerializable | DreamSerializableArray | undefined = undefined,
> {
  /**
   * when true, it will render an openapi document which produces an array of serializables,
   * rather than a single one.
   */
  many?: boolean

  /**
   * when true, it will render an openapi document which
   * produces an object containing pagination data. This
   * output is formatted to match the format returned
   * when calling the `paginate` method
   * within Dream, i.e.
   *
   * ```ts
   * \@OpenAPI(Post, {
   *   paginate: true,
   *   status: 200,
   * })
   * public async index() {
   *   const page = this.castParam('page', 'integer')
   *   const posts = await Post.where(...).paginate({ pageSize: 100, page })
   *   this.ok(posts)
   * }
   * ```
   */
  paginate?: boolean | CustomPaginationOpts

  /**
   * specify path params. This is usually not necessary, since path params
   * are automatically computed for your endpoint by matching against the
   * corresponding routes.ts entry.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    pathParams: { id: { description: 'The ID of the User' } },
   *  })
   * ```
   */
  pathParams?: OpenapiPathParams

  /**
   * specify additional headers for this request
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    headers: {
   *      myDate: {
   *        required: true,
   *        description: 'my date',
   *        format: 'date'
   *      }
   *    }
   *  })
   * ```
   */
  headers?: OpenapiHeaders

  /**
   * specify query parameters for the request
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    query: {
   *      search: {
   *        required: false,
   *        description: 'my query param',
   *        schema: {
   *          type: 'string',
   *        },
   *        allowReserved: true,
   *        allowEmptyValue: true,
   *      },
   *    },
   *  })
   * ```
   */
  query?: OpenapiQueries

  /**
   * specify the shape of the request body. For POST, PATCH, and PUT,
   * this will automatically be done for you if you provide a Dream
   * class as the first argument. Otherwise, you can specify this
   * manually, like so:
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    requestBody: {
   *      type: 'object',
   *      properties: {
   *        myFiend: 'string',
   *      }
   *    }
   *  })
   * ```
   */
  requestBody?: OpenapiSchemaBodyShorthand | OpenapiSchemaRequestBodyOnlyOption | null

  /**
   * an array of tag names you wish to apply to this endpoint.
   * tag names will determine placement of this request within
   * the swagger editor, which is used for previewing openapi
   * documents.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    tags: ['users']
   *  })
   * ```
   */
  tags?: string[]

  /**
   * The top-level description for this endpoint.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    description: 'my endpoint description'
   *  })
   * ```
   */
  description?: string

  /**
   * The top-level summary for this endpoint.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    summary: 'my endpoint summary'
   *  })
   * ```
   */
  summary?: string

  /**
   * which security scheme to use for this endpoint.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 204,
   *    security: { customAuth: [] },
   *  })
   * ```
   */
  security?: OpenapiSecurity

  /**
   * a list of responses to provide for this endpoint. Only
   * provide this if you intend to override the automatic
   * response generation mechanisms built into Psychic.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 201,
   *    responses: {
   *      201: {
   *        type: 'string'
   *      }
   *    }
   *  })
   * ```
   */
  responses?: Partial<
    Record<HttpStatusCode, (OpenapiSchemaBodyShorthand & { description?: string }) | { description: string }>
  >

  /**
   * enables you to augment the default response that Psychic
   * renders. This enables you to allow Psychic to mix in your
   * custom options with the default response it provides.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 201,
   *    defaultResponse: {
   *      description: 'my custom description',
   *    }
   *  })
   * ```
   */
  defaultResponse?: OpenapiEndpointRendererDefaultResponseOption

  /**
   * provide a custom serializerKey to specify which
   * serializer should be used when rendering your
   * serializable entity, i.e.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 201,
   *    many: true,
   *    serializerKey: 'summary'
   *  })
   * ```
   */
  serializerKey?: I extends undefined
    ? never
    : I extends DreamSerializableArray
      ? DreamOrViewModelClassSerializerArrayKeys<I>
      : I extends typeof Dream | ViewModelClass
        ? DreamOrViewModelClassSerializerKey<I>
        : never

  /**
   * the status code that your endpoint will render
   * when it succeeds.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    status: 201,
   *  })
   * ```
   */
  status?: HttpStatusCodeNumber

  /**
   * Whether or not to omit the default headers provided
   * by your Psychic and your application. When set to true,
   * you will have to manually specify all headers that
   * are required for this endpoint.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    omitDefaultHeaders: true
   *  })
   * ```
   */
  omitDefaultHeaders?: boolean

  /**
   * Whether or not to omit the default response provided
   * by your Psychic and your application. When set to true,
   * you will have to manually specify the response shape.
   *
   * ```ts
   * \@OpenAPI(User, {
   *    omitDefaultResponses: true
   *  })
   * ```
   */
  omitDefaultResponses?: boolean
}

export type CustomPaginationOpts =
  | {
      /**
       * if provided, a query param will be added to the
       * openapi spec with the name provided.
       *
       * ```ts
       * @OpenAPI(Post, {
       *   paginate: {
       *     query: 'page'
       *   },
       * })
       * public async index() {
       *   this.ok(
       *     await this.currentUser
       *      .associationQuery('posts')
       *      .paginate({
       *        page: this.castParam('page', 'integer')
       *      })
       *   )
       * }
       * ```
       */
      query: string
    }
  | {
      /**
       * if provided, a requestBody field will be added
       * to the openapi spec with the name provided.
       *
       * ```ts
       * @OpenAPI(Post, {
       *   paginate: {
       *     body: 'page'
       *   },
       * })
       * public async index() {
       *   this.ok(
       *     await this.currentUser
       *      .associationQuery('posts')
       *      .paginate({
       *        page: this.castParam('page', 'integer')
       *      })
       *   )
       * }
       * ```
       */
      body: string
    }

export interface OpenapiEndpointRendererDefaultResponseOption {
  description?: string
  maybeNull?: boolean
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
  schema?: OpenapiBodySegment
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
  servers?: OpenapiServer[]
  security?: OpenapiSecurity
  components: {
    [key: string]: {
      [key: string]: OpenapiSchemaBody | OpenapiContent
    }
  }
}

export interface OpenapiServer {
  url: string
  variables?: Record<string, OpenapiServerVariable>
}

export interface OpenapiServerVariable {
  default?: string
  enum?: string[]
}

export type OpenapiEndpointResponsePath = {
  [method in HttpMethod]: OpenapiMethodBody
} & {
  parameters: OpenapiParameterResponse[]
}

export type OpenapiEndpointResponse = {
  [path: string]: OpenapiEndpointResponsePath
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
  tags?: string[]
  summary?: string
  security?: OpenapiSecurity
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

// used to establish scopes for oauth2
export type OpenapiSecurity = Record<string, string[]>[]

export interface OpenapiSecuritySchemes {
  [key: string]: OpenapiSecurityScheme
}

export type OpenapiSecurityScheme =
  | OpenapiHttpSecurityScheme
  | OpenapiApiKeySecurityScheme
  | OpenapiOpenidConnectSecurityScheme
  | OpenapiOAuth2SecurityScheme

export interface OpenapiHttpSecurityScheme {
  type: 'http'
  scheme: 'basic' | 'bearer'
  bearerFormat?: string
}

export interface OpenapiApiKeySecurityScheme {
  type: 'apiKey'
  in: 'header' | 'body'
  name: string
}

export interface OpenapiOpenidConnectSecurityScheme {
  type: 'openIdConnect'
  openIdConnectUrl: string
}

export interface OpenapiOAuth2SecurityScheme {
  type: 'oauth2'
  flows: Record<
    OpenapiOauth2Flow,
    {
      authorizationUrl: string
      scopes: Record<string, string>
    }
  >
}

export type OpenapiOauth2Flow = 'authorizationCode' | 'implicit' | 'password' | 'clientCredentials'

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

function serializersToSchemaObjects(
  serializers: (DreamModelSerializerType | ViewModelSerializerType | SimpleModelSerializerType)[],
  {
    casing,
    schemaDelimiter,
    suppressResponseEnums,
    openapiName,
    processedSchemas,
  }: {
    casing: SerializerCasing
    schemaDelimiter: string
    suppressResponseEnums: boolean
    openapiName: string
    processedSchemas: Record<string, boolean>
  },
): {
  processedSchemas: Record<string, boolean>
  renderedSchemas: Record<string, OpenapiSchemaBody>
} {
  serializers = serializers.filter(serializer => {
    const serializerOpenapiRenderer = new SerializerOpenapiRenderer(serializer, {
      casing,
      schemaDelimiter,
      suppressResponseEnums,
    })
    return !processedSchemas[serializerOpenapiRenderer.globalName]
  })

  if (!serializers.length) return { processedSchemas, renderedSchemas: {} }

  const renderedSchemas: Record<string, OpenapiSchemaBodyShorthand> = {}
  let dependentOnSerializers: (
    | DreamModelSerializerType
    | ViewModelSerializerType
    | SimpleModelSerializerType
  )[] = []

  serializers.forEach(serializer => {
    const renderer = new SerializerOpenapiRenderer(serializer, {
      casing,
      schemaDelimiter,
      suppressResponseEnums,
    })
    const globalName = renderer.globalName
    processedSchemas = { ...processedSchemas, [globalName]: true }
    const results = renderer.renderedOpenapi(processedSchemas)
    renderedSchemas[renderer.openapiName] = recursivelyTranslateShorthandIntoOpenapi(results.openapi, {
      openapiName,
      casing,
      suppressResponseEnums,
      target: 'response',
    })
    dependentOnSerializers = [...dependentOnSerializers, ...results.referencedSerializers]
  })

  const recursiveResults = serializersToSchemaObjects(
    dependentOnSerializers,

    {
      casing,
      suppressResponseEnums,
      schemaDelimiter,
      openapiName,
      processedSchemas,
    },
  )

  const recursivelyProcessedSchemas = recursiveResults.processedSchemas
  const recursivelyRenderedSchemas = recursiveResults.renderedSchemas
  Object.keys(recursivelyRenderedSchemas).forEach(key => {
    recursivelyRenderedSchemas[key] = recursivelyTranslateShorthandIntoOpenapi(
      recursivelyRenderedSchemas[key],
      {
        openapiName,
        casing,
        suppressResponseEnums,
        target: 'response',
      },
    )
  })

  return {
    processedSchemas: { ...processedSchemas, ...recursivelyProcessedSchemas },
    renderedSchemas: { ...renderedSchemas, ...recursivelyRenderedSchemas } as Record<
      string,
      OpenapiSchemaBody
    >,
  }
}

/**
 * @internal
 *
 * recursive function used to parse nested
 * openapi shorthand objects
 */
function recursivelyTranslateShorthandIntoOpenapi(
  bodySegment: OpenapiBodySegment,
  {
    openapiName,
    casing,
    suppressResponseEnums,
    target,
  }: {
    openapiName: string
    casing: SerializerCasing
    suppressResponseEnums: boolean
    target: OpenapiBodyTarget
  },
): OpenapiSchemaBody {
  return new OpenapiBodySegmentRenderer({
    openapiName,
    bodySegment,
    schemaDelimeter: schemaDelimiter(openapiName),
    casing,
    suppressResponseEnums,
    target,
  }).render()
}
