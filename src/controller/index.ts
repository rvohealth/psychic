import { Dream, DreamApp } from '@rvoh/dream'
import { GlobalNameNotSet } from '@rvoh/dream/errors'
import { OpenapiSchemaBody } from '@rvoh/dream/openapi'
import { DreamSerializerBuilder, ObjectSerializerBuilder } from '@rvoh/dream/system'
import {
  DreamModelSerializerType,
  DreamParamSafeAttributes,
  DreamParamSafeColumnNames,
  SerializerRendererOpts,
  StrictInterface,
  ViewModel,
} from '@rvoh/dream/types'
import { Request, Response } from 'express'
import { ControllerHook } from '../controller/hooks.js'
import ParamValidationError from '../error/controller/ParamValidationError.js'
import HttpStatusBadGateway from '../error/http/BadGateway.js'
import HttpStatusBadRequest from '../error/http/BadRequest.js'
import HttpStatusConflict from '../error/http/Conflict.js'
import HttpStatusContentTooLarge from '../error/http/ContentTooLarge.js'
import HttpStatusExpectationFailed from '../error/http/ExpectationFailed.js'
import HttpStatusFailedDependency from '../error/http/FailedDependency.js'
import HttpStatusForbidden from '../error/http/Forbidden.js'
import HttpStatusGatewayTimeout from '../error/http/GatewayTimeout.js'
import HttpStatusGone from '../error/http/Gone.js'
import HttpStatusImATeapot from '../error/http/ImATeapot.js'
import HttpStatusInsufficientStorage from '../error/http/InsufficientStorage.js'
import HttpStatusInternalServerError from '../error/http/InternalServerError.js'
import HttpStatusLocked from '../error/http/Locked.js'
import HttpStatusMethodNotAllowed from '../error/http/MethodNotAllowed.js'
import HttpStatusMisdirectedRequest from '../error/http/MisdirectedRequest.js'
import HttpStatusNotAcceptable from '../error/http/NotAcceptable.js'
import HttpStatusNotExtended from '../error/http/NotExtended.js'
import HttpStatusNotFound from '../error/http/NotFound.js'
import HttpStatusNotImplemented from '../error/http/NotImplemented.js'
import HttpStatusPaymentRequired from '../error/http/PaymentRequired.js'
import HttpStatusPreconditionFailed from '../error/http/PreconditionFailed.js'
import HttpStatusPreconditionRequired from '../error/http/PreconditionRequired.js'
import HttpStatusProxyAuthenticationRequired from '../error/http/ProxyAuthenticationRequired.js'
import HttpStatusRequestHeaderFieldsTooLarge from '../error/http/RequestHeaderFieldsTooLarge.js'
import HttpStatusServiceUnavailable from '../error/http/ServiceUnavailable.js'
import HttpStatusCodeMap, { HttpStatusCodeInt, HttpStatusSymbol } from '../error/http/status-codes.js'
import HttpStatusTooManyRequests from '../error/http/TooManyRequests.js'
import HttpStatusUnauthorized from '../error/http/Unauthorized.js'
import HttpStatusUnavailableForLegalReasons from '../error/http/UnavailableForLegalReasons.js'
import HttpStatusUnprocessableContent from '../error/http/UnprocessableContent.js'
import HttpStatusUnsupportedMediaType from '../error/http/UnsupportedMediaType.js'
import EnvInternal from '../helpers/EnvInternal.js'
import toJson from '../helpers/toJson.js'
import OpenapiEndpointRenderer from '../openapi-renderer/endpoint.js'
import OpenapiPayloadValidator from '../openapi-renderer/helpers/OpenapiPayloadValidator.js'
import PsychicApp from '../psychic-app/index.js'
import Params, {
  ParamsCastOptions,
  ParamsForOpts,
  ValidatedAllowsNull,
  ValidatedReturnType,
} from '../server/params.js'
import Session, { CustomSessionCookieOptions } from '../session/index.js'
import logIfDevelopment from './helpers/logIfDevelopment.js'
import renderDreamOrVewModel from './helpers/renderDreamOrViewModel.js'

type SerializerResult = {
  [key: string]: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
}

export type ControllerActionMetadata = Record<
  string,
  {
    serializerKey?: string
  }
>

export type PsychicParamsPrimitive = string | number | boolean | null | undefined | PsychicParamsPrimitive[]

export const PsychicParamsPrimitiveLiterals = [
  'bigint',
  'bigint[]',
  'boolean',
  'boolean[]',
  'date',
  'date[]',
  'datetime',
  'datetime[]',
  'integer',
  'integer[]',
  'json',
  'json[]',
  'null',
  'null[]',
  'number',
  'number[]',
  'string',
  'string[]',
  'uuid',
  'uuid[]',
] as const
export type PsychicParamsPrimitiveLiteral = (typeof PsychicParamsPrimitiveLiterals)[number]

export interface PsychicParamsDictionary {
  [key: string]: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[]
}

class InvalidDotNotationPath extends Error {}

export default class PsychicController {
  /**
   * @internal
   *
   * Used internally as a helpful distinguisher between controllers
   * and non-controllers
   */
  public static get isPsychicController() {
    return true
  }

  /**
   * @internal
   *
   * Certain features (e.g. building OpenAPI specs from Attribute and RendersOne/Many decorators)
   * need static access to things set up by decorators. Stage 3 Decorators change the context that is available
   * at decoration time such that the class of a property being decorated is only avilable during instance instantiation. In order
   * to only apply static values once, on boot, `globallyInitializingDecorators` is set to true on PsychicController,
   * and all controllers are instantiated.
   *
   */
  private static globallyInitializingDecorators: boolean = false

  /**
   * @internal
   *
   * Storage for controller action metadata, set when using the association decorators like:
   *   @OpenAPI
   */
  protected static controllerActionMetadata: ControllerActionMetadata = {}

  /**
   * @internal
   *
   * Used to store controller hooks, which are registered
   * by using the `@BeforeAction` decorator on your controllers
   */
  public static controllerHooks: ControllerHook[] = []

  /**
   * @internal
   *
   * Used to store openapi data, which is registered
   * by using the `@Openapi` decorator on your controller methods
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static openapi: Record<string, OpenapiEndpointRenderer<any, any>>

  /**
   * @internal
   *
   * Returns the global identifier for this particular controller.
   * When you first initialize your application, the controllers
   * you provide are organized into a map of key-value pairs,
   * where the keys are global identifiers for each controller, and
   * the values are the matching controllers. The key returned here
   * enables a lookup of the controller from the PsychicApp
   * class.
   */
  public static get globalName(): string {
    if (!this._globalName) throw new GlobalNameNotSet(this)
    return this._globalName
  }

  private static setGlobalName(globalName: string) {
    this._globalName = globalName
  }
  private static _globalName: string | undefined

  /**
   * @internal
   *
   * Used for displaying routes when running `pnpm psy routes`
   * cli command
   */
  public static get disaplayName(): string {
    return this.globalName.replace(/^controllers\//, '').replace(/Controller$/, '')
  }

  /**
   * @internal
   *
   * Returns a controller-action string which is used to signify both
   * the controller and the method to be called for a particular route.
   * For the controller "Api/V1/UsersController" and the method "show",
   * the controllerActionPath would return:
   *
   *   "Api/V1/Users#show"
   */
  public static controllerActionPath(methodName: string) {
    return `${this.globalName.replace(/^controllers\//, '').replace(/Controller$/, '')}#${methodName.toString()}`
  }

  public static get openapiNames(): PsychicOpenapiNames<PsychicController> {
    return ['default']
  }

  public static get openapiConfig(): PsychicOpenapiControllerConfig {
    return {}
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get psychicTypes(): any {
    throw new Error('Must define psychicTypes getter in ApplicationController class within your application')
  }

  /**
   * @internal
   *
   * Used internally as a helpful distinguisher between controllers
   * and non-controllers
   */
  public get isPsychicControllerInstance() {
    return true
  }

  public req: Request
  public res: Response
  public session: Session
  public action: string
  public renderOpts: SerializerRendererOpts
  private startTime: number

  constructor(
    req: Request,
    res: Response,
    {
      action,
    }: {
      action: string
    },
  ) {
    this.startTime = Date.now()
    this.req = req
    this.res = res
    this.session = new Session(req, res)
    this.action = action

    // TODO: read casing from Dream app config
    this.renderOpts = {
      casing: 'camel',
    }
  }

  /**
   * Gets the HTTP request headers from the Express request object.
   *
   * @returns The request headers as a key-value object where header names are lowercase strings
   * and values can be strings, string arrays, or undefined.
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     const contentType = this.headers['content-type']
   *     const authorization = this.headers.authorization
   *     console.log(this.headers)
   *   }
   * }
   * ```
   */
  public get headers() {
    return this.req.headers
  }

  /**
   * Gets the combined parameters from the HTTP request. This includes URL parameters,
   * request body, and query string parameters merged together. The merge order is:
   * query params first, then body params, then URL params (with later values overriding earlier ones).
   *
   * Also performs OpenAPI validation on query parameters if an OpenAPI decorator is present.
   *
   * @returns A dictionary containing all request parameters merged together
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     // Access merged params from URL, body, and query
   *     const userId = this.params.id // from URL params
   *     const filters = this.params.filters // from query or body
   *     console.log(this.params)
   *   }
   * }
   * ```
   */
  public get params(): PsychicParamsDictionary {
    this.validateParams()

    const query = this.getCachedQuery()

    const params: PsychicParamsDictionary = {
      ...query,
      ...this.req.body,
      ...this.req.params,
    } as PsychicParamsDictionary

    return params
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private get currentOpenapiRenderer(): OpenapiEndpointRenderer<any, any> | undefined {
    return (this.constructor as typeof PsychicController).openapi?.[this.action]
  }

  private getCachedQuery(): object {
    if (this._cachedQuery) return this._cachedQuery

    const openapiEndpointRenderer = this.currentOpenapiRenderer
    const query = this.req.query

    if (openapiEndpointRenderer) {
      // validateOpenapiQuery will modify the query passed into it to conform
      // to the openapi shape with regards to arrays, since these are notoriously
      // problematic within the query layer
      this.computedOpenapiNames.forEach(openapiName => {
        new OpenapiPayloadValidator(openapiName, openapiEndpointRenderer).validateOpenapiQuery(query)
      })
    }

    this._cachedQuery = query
    return this._cachedQuery
  }
  private _cachedQuery: object

  /**
   * Gets the value of a specific parameter from the merged params object.
   *
   * **Note:** Consider using {@link castParam} instead for type validation and safety.
   * The {@link castParam} method provides runtime validation and proper type casting,
   * while this method only performs unsafe type assertion.
   *
   * @param key - The parameter name to retrieve
   * @returns The value found for the specified parameter, cast to the ReturnType generic.
   *          Returns undefined if the parameter doesn't exist.
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     // Basic usage (unsafe type assertion)
   *     const id = this.param<string>('id')
   *     const count = this.param<number>('count')
   *
   *     // Preferred: Use castParam for validation
   *     const validatedId = this.castParam('id', 'string')
   *     const validatedCount = this.castParam('count', 'integer')
   *   }
   * }
   * ```
   */
  public param<ReturnType = string>(key: string): ReturnType {
    return this.params[key] as ReturnType
  }

  /**
   * Finds the specified parameter and validates it against the provided type.
   * Supports dot notation for nested object access (e.g., 'user.profile.name').
   * If the param does not match the specified validation arguments, ParamValidationError
   * is raised, which Psychic will catch and convert into a 400 Bad Request response.
   *
   * @param key - The parameter name to retrieve (supports dot notation for nested access)
   * @param expectedType - The expected type or validation rule (primitive type, regex, or OpenAPI schema)
   * @param opts - Optional validation options with the following supported properties:
   *   - `enum`: Array of allowed string values to restrict the parameter to specific choices
   *   - `allowNull`: Boolean indicating whether null values are permitted (default: false)
   * @returns The validated and type-cast parameter value
   * @throws {ParamValidationError} When validation fails (converted to 400 response by Psychic)
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     // Basic type validation
   *     const id = this.castParam('id', 'bigint')
   *     const nested = this.castParam('user.profile.age', 'integer')
   *
   *     // With enum restriction
   *     const status = this.castParam('status', 'string', {
   *       enum: ['active', 'inactive', 'pending']
   *     })
   *
   *     // Allow null values
   *     const optionalName = this.castParam('name', 'string', {
   *       allowNull: true
   *     })
   *   }
   * }
   * ```
   *
   * You can provide additional restrictions using the options arg:
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     const type = this.castParam('type', 'string', { enum: ['Type1', 'Type2'], allowNull: true })
   *   }
   * }
   * ```
   *
   * You can provide hard-coded openapi shapes as well:
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     const type = this.castParam('type', { type: ['string', 'null'], enum: ['Type1', 'Type2', null] })
   *   }
   * }
   * ```
   */
  public castParam<
    const EnumType extends readonly string[],
    OptsType extends StrictInterface<OptsType, ParamsCastOptions<EnumType>>,
    const ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
  >(key: string, expectedType: ExpectedType, opts?: OptsType) {
    try {
      return this._castParam(key.split('.'), this.params, expectedType, opts)
    } catch (error) {
      if (error instanceof InvalidDotNotationPath)
        throw new ParamValidationError(key, [`Invalid dot notation in castParam: ${key}`])
      throw error
    }
  }

  private _castParam<
    const EnumType extends readonly string[],
    OptsType extends StrictInterface<OptsType, ParamsCastOptions<EnumType>>,
    ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
    ValidatedType extends ValidatedReturnType<ExpectedType, OptsType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    FinalReturnType extends AllowNullOrUndefined extends true
      ? ValidatedType | null | undefined
      : ValidatedType,
  >(
    keys: string[],
    params: PsychicParamsDictionary,
    expectedType: ExpectedType,
    opts?: OptsType,
  ): FinalReturnType {
    const key = keys.shift() as string
    if (!keys.length) return Params.cast(params, key, expectedType, opts)

    const nestedParams = params[key]

    if (nestedParams === undefined) {
      if (opts?.allowNull) return null as FinalReturnType
      throw new InvalidDotNotationPath()
    } else if (Array.isArray(nestedParams)) {
      throw new InvalidDotNotationPath()
    } else if (typeof nestedParams !== 'object') {
      throw new InvalidDotNotationPath()
    }

    return this._castParam(keys, nestedParams as PsychicParamsDictionary, expectedType, opts)
  }

  /**
   * Captures and validates parameters for the provided Dream model. Will exclude
   * parameters that are not considered "safe" by default (based on the model's paramSafeColumns).
   * Uses `castParam` for each parameter and will raise an exception if any parameter
   * fails validation.
   *
   * @param dreamClass - The Dream model class to retrieve params for
   * @param opts - Optional configuration object
   * @param opts.only - Restrict the list of allowed params to only these attributes
   * @param opts.including - Include params that would normally be excluded from safe params
   * @param opts.key - Extract params from a nested key in the params object instead of root level
   * @param opts.array - If true, expects and returns an array of param objects (specifically for query params, which, due to the way query params are processed, are often collapsed to a non-array value)
   * @returns A typed object containing the validated and casted params for this Dream model
   * @throws {ParamValidationError} When any parameter validation fails
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public create() {
   *     // Get safe params for User model (excludes sensitive fields like createdAt)
   *     const userParams = this.paramsFor(User)
   *
   *     // Restrict to only specific fields
   *     const restrictedParams = this.paramsFor(User, { only: ['email', 'name'] })
   *
   *     // Include normally excluded fields
   *     const extendedParams = this.paramsFor(User, { including: ['createdAt'] })
   *
   *     // Extract from nested key
   *     const nestedParams = this.paramsFor(User, { key: 'user' })
   *   }
   * }
   * ```
   */
  public paramsFor<
    T extends typeof Dream,
    I extends InstanceType<T>,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
    ForOpts extends StrictInterface<ForOpts, ParamsForOpts<OnlyArray>>,
    ParamSafeColumnsOverride extends I['paramSafeColumns' & keyof I] extends never
      ? undefined
      : I['paramSafeColumns' & keyof I] & string[],
    ParamSafeColumns extends ParamSafeColumnsOverride extends string[] | Readonly<string[]>
      ? Extract<
          DreamParamSafeColumnNames<I>,
          ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>
        >[]
      : DreamParamSafeColumnNames<I>[],
    ParamSafeAttrs extends DreamParamSafeAttributes<InstanceType<T>>,
    ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
      InstanceType<T>
    >)[]
      ? Partial<{
          [K in ForOpts['only'][number] & keyof ParamSafeAttrs]: ParamSafeAttrs[K & keyof ParamSafeAttrs]
        }>
      : Partial<{
          [K in ParamSafeColumns[number & keyof ParamSafeColumns] & string]: DreamParamSafeAttributes<
            InstanceType<T>
          >[K & keyof DreamParamSafeAttributes<InstanceType<T>>]
        }>,
    ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType,
  >(this: PsychicController, dreamClass: T, opts?: ForOpts): ReturnPayload {
    return Params.for(
      opts?.key ? (this.params[opts.key] as typeof this.params) || {} : this.params,
      dreamClass,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opts as any,
    )
  }

  /**
   * Gets a cookie value from the request and casts it to the specified type.
   *
   * @param name - The name of the cookie to retrieve
   * @returns The cookie value cast to RetType, or null if the cookie doesn't exist
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public index() {
   *     const theme = this.getCookie<string>('theme')
   *     const userId = this.getCookie<number>('user_id')
   *   }
   * }
   * ```
   */
  public getCookie<RetType>(name: string): RetType | null {
    return (this.session.getCookie(name) ?? null) as RetType | null
  }

  /**
   * Sets a cookie in the response with the specified name, data, and options.
   *
   * @param name - The name of the cookie to set
   * @param data - The string data to store in the cookie
   * @param opts - Optional cookie configuration (expires, httpOnly, secure, etc.)
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public setPreferences() {
   *     this.setCookie('theme', 'dark', { expires: new Date('2025-12-31') })
   *     this.setCookie('lang', 'en', { httpOnly: false })
   *   }
   * }
   * ```
   */
  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    return this.session.setCookie(name, data, opts)
  }

  /**
   * Starts a user session by setting the session cookie with the user's information.
   * The session cookie contains the user's primary key and model type.
   *
   * @param user - The Dream model instance representing the authenticated user
   *
   * @example
   * ```ts
   * class AuthController extends ApplicationController {
   *   public login() {
   *     const email = this.castParam('email', 'string')
   *     const password = this.castParam('password', 'string')
   *     const user = User.authenticate(email, password)
   *
   *     if (user) {
   *       this.startSession(user)
   *       this.ok({ message: 'Login successful' })
   *     } else {
   *       this.unauthorized('Invalid credentials')
   *     }
   *   }
   * }
   * ```
   */
  public startSession(user: Dream) {
    return this.setCookie(
      PsychicApp.getOrFail().sessionCookieName,
      JSON.stringify({
        id: (user.primaryKeyValue() as string).toString(),
        modelKey: (user.constructor as typeof Dream).globalName,
      }),
    )
  }

  /**
   * Ends the current user session by clearing the session cookie.
   *
   * @example
   * ```ts
   * class AuthController extends ApplicationController {
   *   public logout() {
   *     this.endSession()
   *     this.ok({ message: 'Logged out successfully' })
   *   }
   * }
   * ```
   */
  public endSession() {
    return this.session.clearCookie(PsychicApp.getOrFail().sessionCookieName)
  }

  private singleObjectJson<T>(data: T, opts: RenderOptions): T | SerializerResult | null {
    if (!data) return data
    const psychicControllerClass: typeof PsychicController = this.constructor as typeof PsychicController

    // if we already have a serializer, let's just render it
    if (data instanceof DreamSerializerBuilder || data instanceof ObjectSerializerBuilder) {
      return data.render(this.defaultSerializerPassthrough, this.renderOpts)
    }

    const openapiDef = (this.constructor as typeof PsychicController)?.openapi?.[this.action]

    // passthrough data must be passed both into the serializer and render
    // because, if the serializer does accept passthrough data, then passing it in is how
    // it gets into the serializer, but if it does not accept passthrough data, and therefore
    // does not pass it into the call to DreamSerializer/ObjectSerializer,
    // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
    // handles passing its passthrough data into those
    const passthrough = this.defaultSerializerPassthrough

    if (data instanceof Dream || (data as unknown as ViewModel).serializers) {
      if (!opts.serializerKey && DreamApp.system.isDreamSerializer(openapiDef?.dreamsOrSerializers)) {
        const serializer = openapiDef!.dreamsOrSerializers as DreamModelSerializerType
        return serializer(data, passthrough).render(passthrough, this.renderOpts)
      }

      return renderDreamOrVewModel(
        data as unknown as Dream | ViewModel,
        opts.serializerKey ||
          psychicControllerClass['controllerActionMetadata'][this.action]?.['serializerKey'] ||
          'default',
        passthrough,
        this.renderOpts,
      )
    } else {
      return data
    }
  }

  /**
   * Serializes data to JSON and sends it as the HTTP response with proper
   * OpenAPI validation. Handles Dream models, serializers, arrays, and paginated results.
   *
   * @param data - The data to serialize and send as JSON
   * @param opts - Optional rendering options for serialization
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public index() {
   *     const users = User.all()
   *     this.json(users) // Automatically serializes with default serializer
   *   }
   *
   *   public show() {
   *     const user = User.find(this.param('id'))
   *     this.json(user, { serializerKey: 'detailed' })
   *   }
   * }
   * ```
   */
  public json<T>(
    data: T,
    opts: RenderOptions = {},
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any {
    return this.validateAndRenderJsonResponse(this._json(data, opts))
  }

  private _json<T>(
    data: T,
    opts: RenderOptions = {},
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any {
    const paginatedResults = (data as { results: unknown[] })?.results

    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data.map(d => this.singleObjectJson(d, opts))
      //
    } else if (
      (this.currentOpenapiRenderer?.['paginate'] ||
        this.currentOpenapiRenderer?.['cursorPaginate'] ||
        this.currentOpenapiRenderer?.['scrollPaginate']) &&
      Array.isArray(paginatedResults)
    ) {
      return {
        ...data,
        results: paginatedResults.map(result => this.singleObjectJson(result, opts)),
      }
      //
    } else {
      return this.singleObjectJson(data, opts)
    }
  }

  /**
   * Runs the data through openapi response validation, and then renders
   * the data if no errors were found.
   *
   * @param data - the data to validate and render
   */
  private validateAndRenderJsonResponse(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ) {
    this.validateOpenapiResponseBody(data)
    this.expressSendJson(data)
  }

  private expressSendJson(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    statusCode: number = this.res.statusCode,
  ) {
    this.res.type('json').status(statusCode).send(toJson(data, PsychicApp.getOrFail().sanitizeResponseJson))
    this.logIfDevelopment()
  }

  private expressSendStatus(statusCode: number) {
    this.res.sendStatus(statusCode)
    this.logIfDevelopment()
  }

  private expressRedirect(statusCode: number, newLocation: string) {
    this.res.redirect(statusCode, newLocation)
    this.logIfDevelopment()
  }

  private logIfDevelopment() {
    if (!EnvInternal.isDevelopment) return
    logIfDevelopment({ req: this.req, res: this.res, startTime: this.startTime })
  }

  protected defaultSerializerPassthrough: SerializerResult = {}

  /**
   * Sets additional data to be passed through to serializers during rendering.
   * This data is merged with any existing passthrough data and made available
   * to all serializers used in subsequent render operations.
   *
   * @param passthrough - Object containing data to pass to serializers
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public index() {
   *     // Pass current user context to serializers
   *     this.serializerPassthrough({ currentUser: this.currentUser })
   *
   *     const users = User.all()
   *     this.json(users) // Serializers will have access to currentUser
   *   }
   *
   *   public show() {
   *     this.serializerPassthrough({
   *       includePrivateData: this.currentUser.isAdmin(),
   *       requestedAt: new Date()
   *     })
   *
   *     const user = User.find(this.param('id'))
   *     this.json(user)
   *   }
   * }
   * ```
   */
  public serializerPassthrough(passthrough: SerializerResult) {
    this.defaultSerializerPassthrough = {
      ...this.defaultSerializerPassthrough,
      ...passthrough,
    }
  }

  /**
   * Sets the response status and data for serialization. Uses the status code
   * defined in the OpenAPI decorator if present, otherwise defaults to 200.
   *
   * @param data - The data to send in the response
   * @param opts - Optional rendering options for serialization
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public index() {
   *     const users = User.all()
   *     this.respond(users) // Uses OpenAPI-defined status or 200
   *   }
   * }
   * ```
   */
  public respond<T>(data: T = {} as T, opts: RenderOptions = {}) {
    const openapiData = (this.constructor as typeof PsychicController).openapi[this.action]
    this.res.status(openapiData?.['status'] || 200)

    this.json(data, opts)
  }

  /**
   * Sends a response with a specific HTTP status code and optional body data.
   * Accepts both numeric status codes and symbolic names.
   *
   * @param options - Configuration object
   * @param options.status - HTTP status code (number) or status symbol (string)
   * @param options.body - Optional response body data
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public create() {
   *     const user = User.create(this.paramsFor(User))
   *     this.send({ status: 201, body: user })
   *   }
   *
   *   public customStatus() {
   *     this.send({ status: 'teapot', body: { message: 'I am a teapot' } })
   *   }
   * }
   * ```
   */
  public send({
    status = 200,
    body = undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: { status?: HttpStatusSymbol | HttpStatusCodeInt; body?: any } = {}) {
    // enums can also do a reverse-lookup based on values, so if e.g. 200 is passed as status,
    // the lookup of HttpStatusCodeMap[status as HttpStatusSymbol] would return "ok", rather than undefined.
    const realStatus = (
      typeof HttpStatusCodeMap[status as HttpStatusSymbol] === 'string'
        ? HttpStatusCodeMap[HttpStatusCodeMap[status as HttpStatusSymbol]]
        : HttpStatusCodeMap[status as HttpStatusSymbol]
    ) as number

    this.res.status(realStatus)
    this.json(body)
  }

  /**
   * Redirects the client to a different URL using HTTP 302 Found status.
   *
   * @param path - The URL path to redirect to
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public login() {
   *     // Redirect to dashboard after successful login
   *     this.redirect('/dashboard')
   *   }
   * }
   * ```
   */
  public redirect(path: string) {
    this.res.redirect(path)
  }

  // begin: http status codes

  /**
   * Responds with HTTP 200 OK status and the provided data.
   *
   * @param data - The data to return in the response body
   * @param opts - Optional rendering options for serialization
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public index() {
   *     const users = User.all()
   *     this.ok(users)
   *   }
   * }
   * ```
   */
  // 200
  public ok<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.json(data, opts)
  }

  /**
   * Responds with HTTP 201 Created status and the provided data.
   * Typically used when a new resource has been successfully created.
   *
   * @param data - The data to return in the response body (usually the created resource)
   * @param opts - Optional rendering options for serialization
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public create() {
   *     const user = User.create(this.paramsFor(User))
   *     this.created(user)
   *   }
   * }
   * ```
   */
  // 201
  public created<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(201)
    this.json(data, opts)
  }

  /**
   * Responds with HTTP 202 Accepted status and the provided data.
   * Indicates that the request has been accepted for processing but processing is not complete.
   *
   * @param data - The data to return in the response body
   * @param opts - Optional rendering options for serialization
   *
   * @example
   * ```ts
   * class JobsController extends ApplicationController {
   *   public create() {
   *     const job = Job.createAsync(this.paramsFor(Job))
   *     this.accepted({ job_id: job.id, status: 'processing' })
   *   }
   * }
   * ```
   */
  // 202
  public accepted<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(202)
    this.json(data, opts)
  }

  // 203
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public nonAuthoritativeInformation(message: any = undefined) {
    if (message) {
      this.expressSendJson(message, 203)
    } else {
      this.expressSendStatus(203)
    }
  }

  /**
   * Responds with HTTP 204 No Content status. This indicates that the request
   * was successful but there is no content to return. No response body is sent.
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public destroy() {
   *     const user = User.find(this.param('id'))
   *     user.destroy()
   *     this.noContent() // Successfully deleted, no content to return
   *   }
   * }
   * ```
   */
  // 204
  public noContent() {
    this.expressSendStatus(204)
  }

  // 205
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public resetContent(message: any = undefined) {
    this.res.status(205)
    this.json(message)
  }

  // 208
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public alreadyReported(message: any = undefined) {
    this.res.status(208)
    this.json(message)
  }

  // 301
  public movedPermanently(newLocation: string) {
    this.expressRedirect(301, newLocation)
  }

  // 302
  public found(newLocation: string) {
    this.expressRedirect(302, newLocation)
  }

  // 303
  public seeOther(newLocation: string) {
    this.expressRedirect(303, newLocation)
  }

  // 307
  public temporaryRedirect(newLocation: string) {
    this.expressRedirect(307, newLocation)
  }

  // 308
  public permanentRedirect(newLocation: string) {
    this.expressRedirect(308, newLocation)
  }

  /**
   * Throws an HTTP 400 Bad Request error. Use this when the client request
   * is malformed or contains invalid data.
   *
   * @param data - Optional error data to include in the response
   * @throws {HttpStatusBadRequest} Always throws this error
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public create() {
   *     if (!this.param('email')) {
   *       this.badRequest({ error: 'Email is required' })
   *     }
   *   }
   * }
   * ```
   */
  // 400
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public badRequest(data: any = undefined) {
    throw new HttpStatusBadRequest(data)
  }

  /**
   * Throws an HTTP 401 Unauthorized error. Use this when authentication
   * is required but not provided or invalid.
   *
   * @param message - Optional error message to include in the response
   * @throws {HttpStatusUnauthorized} Always throws this error
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public show() {
   *     if (!this.currentUser) {
   *       this.unauthorized('Authentication required')
   *     }
   *   }
   * }
   * ```
   */
  // 401
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unauthorized(message: any = undefined) {
    throw new HttpStatusUnauthorized(message)
  }

  // 402
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public paymentRequired(message: any = undefined) {
    throw new HttpStatusPaymentRequired(message)
  }

  /**
   * Throws an HTTP 403 Forbidden error. Use this when the client is authenticated
   * but does not have permission to access the requested resource.
   *
   * @param message - Optional error message to include in the response
   * @throws {HttpStatusForbidden} Always throws this error
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public destroy() {
   *     const user = User.find(this.param('id'))
   *     if (!this.currentUser.canDelete(user)) {
   *       this.forbidden('You do not have permission to delete this user')
   *     }
   *   }
   * }
   * ```
   */
  // 403
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public forbidden(message: any = undefined) {
    throw new HttpStatusForbidden(message)
  }

  /**
   * Throws an HTTP 404 Not Found error. Use this when the requested resource
   * does not exist.
   *
   * @param message - Optional error message to include in the response
   * @throws {HttpStatusNotFound} Always throws this error
   *
   * @example
   * ```ts
   * class UsersController extends ApplicationController {
   *   public show() {
   *     const user = User.find(this.param('id'))
   *     if (!user) {
   *       this.notFound('User not found')
   *     }
   *   }
   * }
   * ```
   */
  // 404
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public notFound(message: any = undefined) {
    throw new HttpStatusNotFound(message)
  }

  // 405
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public methodNotAllowed(message: any = undefined) {
    throw new HttpStatusMethodNotAllowed(message)
  }

  // 406
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public notAcceptable(message: any = undefined) {
    throw new HttpStatusNotAcceptable(message)
  }

  // 407
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public proxyAuthenticationRequired(message: any = undefined) {
    throw new HttpStatusProxyAuthenticationRequired(message)
  }

  // 409
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public conflict(message: any = undefined) {
    throw new HttpStatusConflict(message)
  }

  // 410
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public gone(message: any = undefined) {
    throw new HttpStatusGone(message)
  }

  // 412
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public preconditionFailed(message: any = undefined) {
    throw new HttpStatusPreconditionFailed(message)
  }

  // 413
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public contentTooLarge(message: any = undefined) {
    throw new HttpStatusContentTooLarge(message)
  }

  // 415
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unsupportedMediaType(message: any = undefined) {
    throw new HttpStatusUnsupportedMediaType(message)
  }

  // 417
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public expectationFailed(message: any = undefined) {
    throw new HttpStatusExpectationFailed(message)
  }

  // 418
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public imATeampot(message: any = undefined) {
    throw new HttpStatusImATeapot(message)
  }

  // 421
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public misdirectedRequest(message: any = undefined) {
    throw new HttpStatusMisdirectedRequest(message)
  }

  // 422
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unprocessableContent(data: any = undefined) {
    throw new HttpStatusUnprocessableContent(data)
  }

  // 423
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public locked(message: any = undefined) {
    throw new HttpStatusLocked(message)
  }

  // 424
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public failedDependency(message: any = undefined) {
    throw new HttpStatusFailedDependency(message)
  }

  // 428
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public preconditionRequired(message: any = undefined) {
    throw new HttpStatusPreconditionRequired(message)
  }

  // 429
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public tooManyRequests(message: any = undefined) {
    throw new HttpStatusTooManyRequests(message)
  }

  // 431
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public requestHeaderFieldsTooLarge(message: any = undefined) {
    throw new HttpStatusRequestHeaderFieldsTooLarge(message)
  }

  // 451
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unavailableForLegalReasons(message: any = undefined) {
    throw new HttpStatusUnavailableForLegalReasons(message)
  }

  // 500
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public internalServerError(data: any = undefined) {
    throw new HttpStatusInternalServerError(data)
  }

  // 501
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public notImplemented(message: any = undefined) {
    throw new HttpStatusNotImplemented(message)
  }

  // 502
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public badGateway(message: any = undefined) {
    throw new HttpStatusBadGateway(message)
  }

  // 503
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public serviceUnavailable(message: any = undefined) {
    throw new HttpStatusServiceUnavailable(message)
  }

  // 504
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public gatewayTimeout(message: any = undefined) {
    throw new HttpStatusGatewayTimeout(message)
  }

  // 507
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public insufficientStorage(message: any = undefined) {
    throw new HttpStatusInsufficientStorage(message)
  }

  // 510
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public notExtended(message: any = undefined) {
    throw new HttpStatusNotExtended(message)
  }
  // end: http status codes

  /**
   * @internal
   *
   * Called by the psychic router when the endpoint for
   * this controller was hit.
   *
   * @param action - the action to use when validating the query params.
   */
  public async runAction() {
    await this.runBeforeActions()

    if (this.res.headersSent) return

    this.validateParams()

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    await (this as any)[this.action]()
  }

  private paramsValidated: boolean = false
  private validateParams() {
    if (this.paramsValidated) return
    this.paramsValidated = true
    this.validateOpenapiHeadersForAction()
    this.validateOpenapiQueryForAction()
    this.validateOpenapiRequestBodyForAction()
  }

  /**
   * Validates the request body.
   * If an OpenAPI decorator was attached to this endpoint,
   * the computed headers for that decorator will
   * be used to validate this endpoint.
   *
   * @param action - the action to use when validating the query params.
   */
  private validateOpenapiRequestBodyForAction(): void {
    const openapiEndpointRenderer = this.currentOpenapiRenderer
    if (!openapiEndpointRenderer) return

    this.computedOpenapiNames.forEach(openapiName => {
      new OpenapiPayloadValidator(openapiName, openapiEndpointRenderer).validateOpenapiRequestBody(
        this.req.body,
      )
    })
  }

  /**
   * Validates the request headers.
   * If an OpenAPI decorator was attached to this endpoint,
   * the computed headers for that decorator will
   * be used to validate this endpoint.
   *
   * @param action - the action to use when validating the query params.
   */
  private validateOpenapiHeadersForAction(): void {
    const openapiEndpointRenderer = this.currentOpenapiRenderer
    if (!openapiEndpointRenderer) return

    this.computedOpenapiNames.forEach(openapiName => {
      new OpenapiPayloadValidator(openapiName, openapiEndpointRenderer).validateOpenapiHeaders(
        this.req.headers,
      )
    })
  }

  /**
   * Validates the request query params.
   * If an OpenAPI decorator was attached to this endpoint,
   * the computed query params for that decorator will
   * be used to validate this endpoint.
   *
   * @param action - the action to use when validating the query params.
   */
  private validateOpenapiQueryForAction(): void {
    const openapiEndpointRenderer = this.currentOpenapiRenderer
    if (!openapiEndpointRenderer) return

    this.computedOpenapiNames.forEach(openapiName => {
      new OpenapiPayloadValidator(openapiName, openapiEndpointRenderer).validateOpenapiQuery(this.req.query)
    })
  }

  /**
   * Validates the data in the context of a response body.
   * If an OpenAPI decorator was attached to this endpoint,
   * the computed response schema for that decorator will
   * be used to validate this endpoint based on the status code
   * set.
   *
   * @param data - the response body data to render
   */
  private validateOpenapiResponseBody(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
  ): void {
    const openapiEndpointRenderer = this.currentOpenapiRenderer
    if (!openapiEndpointRenderer) return

    this.computedOpenapiNames.forEach(openapiName => {
      new OpenapiPayloadValidator(openapiName, openapiEndpointRenderer).validateOpenapiResponseBody(
        data,
        this.res.statusCode,
      )
    })
  }

  /**
   * @internal
   *
   * @returns the openapiNames set on the constructor, or else ['default']
   */
  private get computedOpenapiNames(): string[] {
    return ((this.constructor as typeof PsychicController).openapiNames as string[]) || ['default']
  }

  /**
   * @internal
   *
   * Runs the before actions for a particular action on a controller
   */
  public async runBeforeActions() {
    const beforeActions = (this.constructor as typeof PsychicController).controllerHooks.filter(hook =>
      hook.shouldFireForAction(this.action),
    )

    for (const hook of beforeActions) {
      if (this.res.headersSent) return

      if (hook.isStatic) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        await (this.constructor as any)[hook.methodName]()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        await (this as any)[hook.methodName]()
      }
    }
  }
}

// Since Dream explicitly types the return type of
// the serializers getter as, e.g., DreamSerializers<User>,
// in order to enforce valid serializer global names as the
// values of the serializers object, we can't make the
// serializers object into a const and therefore can't
// leverage the key values to enforce a valid serializerKey
export type RenderOptions = { serializerKey?: string }

export type PsychicOpenapiControllerConfig = {
  omitDefaultHeaders?: boolean
  omitDefaultResponses?: boolean
  tags?: string[]
}

export type PsychicOpenapiNames<
  T extends PsychicController,
  PsyTypes extends T['psychicTypes'] = T['psychicTypes'],
  OpenapiNames extends PsyTypes['openapiNames'] = PsyTypes['openapiNames'],
  OpenapiName extends OpenapiNames[number] = OpenapiNames[number],
> = OpenapiName[]
