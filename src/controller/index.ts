import {
  Dream,
  DreamApp,
  DreamModelSerializerType,
  DreamParamSafeAttributes,
  GlobalNameNotSet,
  isDreamSerializer,
  SerializerRenderer,
  SimpleObjectSerializerType,
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
import OpenapiEndpointRenderer from '../openapi-renderer/endpoint.js'
import PsychicApp from '../psychic-app/index.js'
import Params, {
  ParamsCastOptions,
  ParamsForOpts,
  ValidatedAllowsNull,
  ValidatedReturnType,
} from '../server/params.js'
import Session, { CustomSessionCookieOptions } from '../session/index.js'
import isPaginatedResult from './helpers/isPaginatedResult.js'

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
  public static openapi: Record<string, OpenapiEndpointRenderer<any>>

  /**
   * Enables you to specify specific serializers to use
   * when encountering specific models, i.e.
   *
   * ```ts
   * class MyController extends AuthedController {
   *   static {
   *     this.serializes(User).with(UserCustomSerializer)
   *   }
   * }
   * ````
   */
  public static serializes(ModelClass: typeof Dream) {
    return {
      with: (SerializerClass: DreamModelSerializerType | SimpleObjectSerializerType) => {
        controllerSerializerIndex.add(this, SerializerClass, ModelClass)
        return this
      },
    }
  }

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
  public config: PsychicApp
  public action: string
  constructor(
    req: Request,
    res: Response,
    {
      config,
      action,
    }: {
      config: PsychicApp
      action: string
    },
  ) {
    this.req = req
    this.res = res
    this.config = config
    this.session = new Session(req, res)
    this.action = action
  }

  public get params(): PsychicParamsDictionary {
    const params: PsychicParamsDictionary = {
      ...this.req.params,
      ...this.req.body,
      ...this.req.query,
    } as PsychicParamsDictionary

    return params
  }

  public param<ReturnType = string>(key: string): ReturnType {
    return this.params[key] as ReturnType
  }

  public castParam<
    const EnumType extends readonly string[],
    OptsType extends ParamsCastOptions<EnumType>,
    ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | RegExp,
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
    ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | RegExp,
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

  public paramsFor<
    DreamClass extends typeof Dream,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<InstanceType<DreamClass>>)[],
    ForOpts extends ParamsForOpts<OnlyArray> & {
      key?: string
    },
  >(this: PsychicController, dreamClass: DreamClass, opts?: ForOpts) {
    return Params.for(
      opts?.key ? (this.params[opts.key] as typeof this.params) || {} : this.params,
      dreamClass,
      opts,
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
      this.config.sessionCookieName,
      JSON.stringify({
        id: user.primaryKeyValue,
        modelKey: (user.constructor as typeof Dream).globalName,
      }),
    )
  }

  public endSession() {
    return this.session.clearCookie(this.config.sessionCookieName)
  }

  private singleObjectJson<T>(data: T, opts: RenderOptions): T | SerializerResult | null {
    if (!data) return data
    const dreamApp = DreamApp.getOrFail()
    const psychicControllerClass: typeof PsychicController = this.constructor as typeof PsychicController

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const lookup = controllerSerializerIndex.lookupModel(this.constructor as any, (data as any).constructor)
    if (lookup?.length) {
      const serializer = lookup?.[1]
      if (isDreamSerializer(serializer)) {
        return new SerializerRenderer(
          // passthrough data going into the serializer is the argument that gets
          // used in the custom attribute callback function
          serializer(data, this.defaultSerializerPassthrough),

          // passthrough data must be passed both into the serializer and the SerializerRenderer
          // because, if the serializer does accept passthrough data, then passing it in is how
          // it gets into the serializer, but if it does not accept passthrough data, and therefore
          // does not pass it into the call to DreamSerializer/ObjectSerializer,
          // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
          // handles passing its passthrough data into those
          this.defaultSerializerPassthrough,
          {
            casing: 'camel',
          },
        ).render()
      }
    } else {
      const serializerKey =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (data as any).serializers?.[
          opts.serializerKey ||
            psychicControllerClass['controllerActionMetadata'][this.action]?.['serializerKey'] ||
            'default'
        ] as string | undefined

      if (serializerKey && Object.prototype.hasOwnProperty.call(dreamApp.serializers, serializerKey)) {
        const serializer = dreamApp.serializers[serializerKey]
        if (serializer && isDreamSerializer(serializer)) {
          return new SerializerRenderer(
            // passthrough data going into the serializer is the argument that gets
            // used in the custom attribute callback function
            serializer(data, this.defaultSerializerPassthrough),

            // passthrough data must be passed both into the serializer and the SerializerRenderer
            // because, if the serializer does accept passthrough data, then passing it in is how
            // it gets into the serializer, but if it does not accept passthrough data, and therefore
            // does not pass it into the call to DreamSerializer/ObjectSerializer,
            // then it would be lost to serializers rendered via rendersOne/Many, and SerializerRenderer
            // handles passing its passthrough data into those
            this.defaultSerializerPassthrough,
            {
              casing: 'camel',
            },
          ).render()
        } else {
          throw new Error(
            `
A serializer key was detected, but the server was unable to identify an associated serializer class matching the key.
The key in question is: "${serializerKey}"`,
          )
        }
      }
    }

    return data
  }

  public json<T>(
    data: T,
    opts: RenderOptions = {},
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any {
    if (Array.isArray(data))
      return this.res.json(
        data.map(d =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          this.singleObjectJson(d, opts),
        ),
      )

    if (isPaginatedResult(data))
      return this.res.json({
        ...data,
        results: (data as { results: unknown[] }).results.map(result => this.singleObjectJson(result, opts)),
      })

    return this.res.json(this.singleObjectJson(data, opts))
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

    this.res.status(realStatus).json(body)
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
    this.res.status(205).send(message)
  }

  // 208
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public alreadyReported(message: any = undefined) {
    this.res.status(208).send(message)
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

  public async runAction(action: string) {
    await this.runBeforeActionsFor(action)

    if (this.res.headersSent) return

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    await (this as any)[action]()
  }

  public async runBeforeActionsFor(action: string) {
    const beforeActions = (this.constructor as typeof PsychicController).controllerHooks.filter(hook =>
      hook.shouldFireForAction(action),
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

export class ControllerSerializerIndex {
  public associations: [
    typeof PsychicController,
    DreamModelSerializerType | SimpleObjectSerializerType,
    typeof Dream,
  ][] = []

  public add(
    ControllerClass: typeof PsychicController,
    SerializerClass: DreamModelSerializerType | SimpleObjectSerializerType,
    ModelClass: typeof Dream,
  ) {
    this.associations.push([ControllerClass, SerializerClass, ModelClass])
  }

  public lookupModel(ControllerClass: typeof PsychicController, ModelClass: typeof Dream) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[2] === ModelClass,
    )
  }

  public lookupSerializer(
    ControllerClass: typeof PsychicController,
    SerializerClass: DreamModelSerializerType | SimpleObjectSerializerType,
  ) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[1] === SerializerClass,
    )
  }
}

export const controllerSerializerIndex = new ControllerSerializerIndex()

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
