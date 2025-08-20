import {
  Dream,
  DreamModelSerializerType,
  DreamParamSafeAttributes,
  DreamParamSafeColumnNames,
  DreamSerializerBuilder,
  GlobalNameNotSet,
  isDreamSerializer,
  ObjectSerializerBuilder,
  OpenapiSchemaBody,
  SerializerRendererOpts,
  UpdateableProperties,
  ViewModel,
} from '@rvoh/dream'
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
import isPaginatedResult from './helpers/isPaginatedResult.js'
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
   * Used for displaying routes when running `yarn psy routes`
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

  constructor(
    req: Request,
    res: Response,
    {
      action,
    }: {
      action: string
    },
  ) {
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
   * @returns the request headers
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     console.log(this.headers)
   *   }
   * }
   * ```
   */
  public get headers() {
    return this.req.headers
  }

  /**
   * @returns the combination of the request uri params, request body, and query
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
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
   * @returns the value found for a particular param
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     console.log(this.param('myParam'))
   *   }
   * }
   * ```
   */
  public param<ReturnType = string>(key: string): ReturnType {
    return this.params[key] as ReturnType
  }

  /**
   * finds the specified param, and validates it against
   * the provided type. If the param does not match the specified
   * validation arguments, ParamValidationError is raised, which
   * Psychic will catch and convert into a 400 response.
   *
   * @returns the value found for a particular param
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     const id = this.castParam('id', 'bigint')
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
    OptsType extends ParamsCastOptions<EnumType>,
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
    OptsType extends ParamsCastOptions<EnumType>,
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
   * Captures params for the provided model. Will exclude params that are not
   * considered "safe" by default. It will use `castParam` for each of the
   * params, and will raise an exception if any of those params does not
   * pass validation.
   *
   * @param dreamClass - the dream class you wish to retreive params for
   * @param opts - optional configuration object
   * @param opts.only - optional: restrict the list of allowed params
   * @param opts.including - optional: include params that would normally be excluded.
   *
   * @returns a typed object, containing the casted params for this dream class
   *
   * @example
   * ```ts
   * class MyController extends ApplicationController {
   *   public index() {
   *     const params = this.paramsFor(User, { only: ['email'], including: ['createdAt'] })
   *   }
   * }
   * ```
   */
  public paramsFor<
    T extends typeof Dream,
    I extends InstanceType<T>,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
    const IncludingArray extends Exclude<keyof UpdateableProperties<I>, OnlyArray[number]>[],
    ForOpts extends ParamsForOpts<OnlyArray, IncludingArray> & { key?: string },
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
    ReturnPartialTypeWithIncluding extends ForOpts['including'] extends readonly (keyof UpdateableProperties<
      InstanceType<T>
    >)[]
      ? ReturnPartialType &
          Partial<{
            [K in Extract<
              keyof UpdateableProperties<InstanceType<T>>,
              ForOpts['including'][number & keyof ForOpts['including']]
            >]: UpdateableProperties<InstanceType<T>>[K]
          }>
      : ReturnPartialType,
    ReturnPayload extends ForOpts['array'] extends true
      ? ReturnPartialTypeWithIncluding[]
      : ReturnPartialTypeWithIncluding,
  >(this: PsychicController, dreamClass: T, opts?: ForOpts): ReturnPayload {
    return Params.for(
      opts?.key ? (this.params[opts.key] as typeof this.params) || {} : this.params,
      dreamClass,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opts as any,
    )
  }

  public getCookie<RetType>(name: string): RetType | null {
    return (this.session.getCookie(name) ?? null) as RetType | null
  }

  public setCookie(name: string, data: string, opts: CustomSessionCookieOptions = {}) {
    return this.session.setCookie(name, data, opts)
  }

  public startSession(user: Dream) {
    return this.setCookie(
      PsychicApp.getOrFail().sessionCookieName,
      JSON.stringify({
        id: (user.primaryKeyValue() as string).toString(),
        modelKey: (user.constructor as typeof Dream).globalName,
      }),
    )
  }

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
      if (!opts.serializerKey && isDreamSerializer(openapiDef?.dreamsOrSerializers)) {
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
    if (Array.isArray(data)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return data.map(d => this.singleObjectJson(d, opts))
      //
    } else if (isPaginatedResult(data)) {
      return {
        ...data,
        results: (data as { results: unknown[] }).results.map(result => this.singleObjectJson(result, opts)),
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
    this.res.type('json').send(toJson(data, PsychicApp.getOrFail().sanitizeResponseJson))
  }

  protected defaultSerializerPassthrough: SerializerResult = {}
  public serializerPassthrough(passthrough: SerializerResult) {
    this.defaultSerializerPassthrough = {
      ...this.defaultSerializerPassthrough,
      ...passthrough,
    }
  }

  public respond<T>(data: T = {} as T, opts: RenderOptions = {}) {
    const openapiData = (this.constructor as typeof PsychicController).openapi[this.action]
    this.res.status(openapiData?.['status'] || 200)

    this.json(data, opts)
  }

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

  public redirect(path: string) {
    this.res.redirect(path)
  }

  // begin: http status codes
  // 200
  public ok<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.json(data, opts)
  }

  // 201
  public created<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(201)
    this.json(data, opts)
  }

  // 202
  public accepted<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(202)
    this.json(data, opts)
  }

  // 203
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public nonAuthoritativeInformation(message: any = undefined) {
    if (message) {
      this.res.status(203).json(message)
    } else {
      this.res.sendStatus(203)
    }
  }

  // 204
  public noContent() {
    this.res.sendStatus(204)
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
    this.res.redirect(301, newLocation)
  }

  // 302
  public found(newLocation: string) {
    this.res.redirect(302, newLocation)
  }

  // 303
  public seeOther(newLocation: string) {
    this.res.redirect(303, newLocation)
  }

  // 304
  public notModified(newLocation: string) {
    this.res.redirect(304, newLocation)
  }

  // 307
  public temporaryRedirect(newLocation: string) {
    this.res.redirect(307, newLocation)
  }

  // 308
  public permanentRedirect(newLocation: string) {
    this.res.redirect(308, newLocation)
  }

  // 400
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public badRequest(data: any = undefined) {
    throw new HttpStatusBadRequest(data)
  }

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

  // 403
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public forbidden(message: any = undefined) {
    throw new HttpStatusForbidden(message)
  }

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
