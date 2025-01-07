import {
  Dream,
  DreamApplication,
  DreamParamSafeAttributes,
  DreamSerializer,
  GlobalNameNotSet,
} from '@rvohealth/dream'
import { Request, Response } from 'express'
import { ControllerHook } from '../controller/hooks'
import BadRequest from '../error/http/BadRequest'
import Conflict from '../error/http/Conflict'
import Forbidden from '../error/http/Forbidden'
import InternalServerError from '../error/http/InternalServerError'
import NotFound from '../error/http/NotFound'
import ServiceUnavailable from '../error/http/ServiceUnavailable'
import HttpStatusCodeMap, { HttpStatusCodeInt, HttpStatusSymbol } from '../error/http/status-codes'
import Unauthorized from '../error/http/Unauthorized'
import UnprocessableEntity from '../error/http/UnprocessableEntity'
import OpenapiEndpointRenderer from '../openapi-renderer/endpoint'
import PsychicApplication from '../psychic-application'
import Params, {
  ParamValidationError,
  ParamsCastOptions,
  ParamsForOpts,
  ValidatedAllowsNull,
  ValidatedReturnType,
} from '../server/params'
import Session, { CustomSessionCookieOptions } from '../session'
import MethodNotAllowed from '../error/http/MethodNotAllowed'
import NotAcceptable from '../error/http/NotAcceptable'
import ProxyAuthenticationRequired from '../error/http/ProxyAuthenticationRequired'
import RequestTimeout from '../error/http/RequestTimeout'
import Gone from '../error/http/Gone'
import LengthRequired from '../error/http/LengthRequired'
import PreconditionFailed from '../error/http/PreconditionFailed'
import PayloadTooLarge from '../error/http/PayloadTooLarge'
import URITooLong from '../error/http/URITooLong'
import UnsupportedMediaType from '../error/http/UnsupportedMediaType'
import RangeNotSatisfiable from '../error/http/RangeNotSatisfiable'
import ExpectationFailed from '../error/http/ExpectationFailed'
import ImATeapot from '../error/http/ImATeapot'
import MisdirectedRequest from '../error/http/MisdirectedRequest'
import BadGateway from '../error/http/BadGateway'
import FailedDependency from '../error/http/FailedDependency'
import TooEarly from '../error/http/TooEarly'
import UpgradeRequired from '../error/http/UpgradeRequired'
import PreconditionRequired from '../error/http/PreconditionRequired'
import TooManyRequests from '../error/http/TooManyRequests'
import RequestHeaderFieldsTooLarge from '../error/http/RequestHeaderFieldsTooLarge'
import UnavailableForLegalReasons from '../error/http/UnavailableForLegalReasons'
import Locked from '../error/http/Locked'
import GatewayTimeout from '../error/http/GatewayTimeout'
import HttpVersionNotSupported from '../error/http/HttpVersionNotSupported'
import VariantAlsoNegotiates from '../error/http/VariantAlsoNegotiates'
import InsufficientStorage from '../error/http/InsufficientStorage'
import LoopDetected from '../error/http/LoopDetected'
import NotExtended from '../error/http/NotExtended'
import NetworkAuthenticationRequired from '../error/http/NetworkAuthenticationRequired'
import PaymentRequired from '../error/http/PaymentRequired'
import NotImplemented from '../error/http/NotImplemented'

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
      with: (SerializerClass: typeof DreamSerializer) => {
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
   * enables a lookup of the controller from the PsychicApplication
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

  public static get openapiName(): PsychicOpenapiNames<PsychicController> {
    return 'default'
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
  public config: PsychicApplication
  public action: string
  constructor(
    req: Request,
    res: Response,
    {
      config,
      action,
    }: {
      config: PsychicApplication
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
        throw new ParamValidationError(`Invalid dot notation in castParam: ${key}`)
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
    if (!keys.length) return Params.cast(params[key] as PsychicParamsPrimitive, expectedType, opts)

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

  private singleObjectJson<T>(data: T, opts: RenderOptions): T | SerializerResult {
    if (!data) return data
    const dreamApp = DreamApplication.getOrFail()
    const psychicControllerClass: typeof PsychicController = this.constructor as typeof PsychicController

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const lookup = controllerSerializerIndex.lookupModel(this.constructor as any, (data as any).constructor)
    if (lookup?.length) {
      const serializerClass = lookup?.[1]
      if (typeof serializerClass === 'function' && serializerClass.isDreamSerializer) {
        return new serializerClass(data).passthrough(this.defaultSerializerPassthrough).render()
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
        const serializerClass = dreamApp.serializers[serializerKey]
        if (typeof serializerClass === 'function' && serializerClass.isDreamSerializer) {
          return new serializerClass(data).passthrough(this.defaultSerializerPassthrough).render()
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
  // 100
  public continue() {
    this.res.sendStatus(100)
  }

  // 101
  public switchingProtocols() {
    this.res.sendStatus(101)
  }

  // 102
  public processing() {
    this.res.sendStatus(102)
  }

  // 103
  public earlyHints() {
    this.res.sendStatus(103)
  }

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
  public nonAuthoritativeInformation() {
    this.res.sendStatus(203)
  }

  // 204
  public noContent() {
    this.res.sendStatus(204)
  }

  // 205
  public resetContent(message: string | undefined = undefined) {
    this.res.status(205).send(message)
  }

  // 206
  public partialContent(message: string | undefined = undefined) {
    this.res.status(206).send(message)
  }

  // 207
  public multiStatus(message: string | undefined = undefined) {
    this.res.status(207).send(message)
  }

  // 208
  public alreadyReported(message: string | undefined = undefined) {
    this.res.status(208).send(message)
  }

  // 226
  public imUsed(message: string | undefined = undefined) {
    this.res.status(226).send(message)
  }

  // 300
  public multipleChoices(message: string) {
    this.res.redirect(300, message)
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
  public badRequest(data: SerializerResult = {}) {
    throw new BadRequest(data)
  }

  // 401
  public unauthorized(message: string | undefined = undefined) {
    throw new Unauthorized(message)
  }

  // 402
  public paymentRequired(message: string | undefined = undefined) {
    throw new PaymentRequired(message)
  }

  // 403
  public forbidden(message: string | undefined = undefined) {
    throw new Forbidden(message)
  }

  // 404
  public notFound(message: string | undefined = undefined) {
    throw new NotFound(message)
  }

  // 405
  public methodNotAllowed(message: string | undefined = undefined) {
    throw new MethodNotAllowed(message)
  }

  // 406
  public notAcceptable(message: string | undefined = undefined) {
    throw new NotAcceptable(message)
  }

  // 407
  public proxyAuthenticationRequired(message: string | undefined = undefined) {
    throw new ProxyAuthenticationRequired(message)
  }

  // 408
  public requestTimeout(message: string | undefined = undefined) {
    throw new RequestTimeout(message)
  }

  // 409
  public conflict(message: string | undefined = undefined) {
    throw new Conflict(message)
  }

  // 410
  public gone(message: string | undefined = undefined) {
    throw new Gone(message)
  }

  // 411
  public lengthRequired(message: string | undefined = undefined) {
    throw new LengthRequired(message)
  }

  // 412
  public preconditionFailed(message: string | undefined = undefined) {
    throw new PreconditionFailed(message)
  }

  // 413
  public payloadTooLarge(message: string | undefined = undefined) {
    throw new PayloadTooLarge(message)
  }

  // 414
  public uriTooLong(message: string | undefined = undefined) {
    throw new URITooLong(message)
  }

  // 415
  public unsupportedMediaType(message: string | undefined = undefined) {
    throw new UnsupportedMediaType(message)
  }

  // 416
  public rangeNotSatisfiable(message: string | undefined = undefined) {
    throw new RangeNotSatisfiable(message)
  }

  // 417
  public expectationFailed(message: string | undefined = undefined) {
    throw new ExpectationFailed(message)
  }

  // 418
  public imATeampot(message: string | undefined = undefined) {
    throw new ImATeapot(message)
  }

  // 421
  public misdirectedRequest(message: string | undefined = undefined) {
    throw new MisdirectedRequest(message)
  }

  // 422
  public unprocessableEntity(data: SerializerResult = {}) {
    throw new UnprocessableEntity(data)
  }

  // 423
  public locked(message: string | undefined = undefined) {
    throw new Locked(message)
  }

  // 424
  public failedDependency(message: string | undefined = undefined) {
    throw new FailedDependency(message)
  }

  // 425
  public tooEarly(message: string | undefined = undefined) {
    throw new TooEarly(message)
  }

  // 426
  public upgradeRequired(message: string | undefined = undefined) {
    throw new UpgradeRequired(message)
  }

  // 428
  public preconditionRequired(message: string | undefined = undefined) {
    throw new PreconditionRequired(message)
  }

  // 429
  public tooManyRequests(message: string | undefined = undefined) {
    throw new TooManyRequests(message)
  }

  // 431
  public requestHeaderFieldsTooLarge(message: string | undefined = undefined) {
    throw new RequestHeaderFieldsTooLarge(message)
  }

  // 451
  public unavailableForLegalReasons(message: string | undefined = undefined) {
    throw new UnavailableForLegalReasons(message)
  }

  // 500
  public internalServerError(data: SerializerResult = {}) {
    throw new InternalServerError(data)
  }

  // 501
  public notImplemented(message: string | undefined = undefined) {
    throw new NotImplemented(message)
  }

  // 502
  public badGateway(message: string | undefined = undefined) {
    throw new BadGateway(message)
  }

  // 503
  public serviceUnavailable(message: string | undefined = undefined) {
    throw new ServiceUnavailable(message)
  }

  // 504
  public gatewayTimeout(message: string | undefined = undefined) {
    throw new GatewayTimeout(message)
  }

  // 505
  public httpVersionNotSupported(message: string | undefined = undefined) {
    throw new HttpVersionNotSupported(message)
  }

  // 506
  public variantAlsoNegotiates(message: string | undefined = undefined) {
    throw new VariantAlsoNegotiates(message)
  }

  // 507
  public insufficientStorage(message: string | undefined = undefined) {
    throw new InsufficientStorage(message)
  }

  // 508
  public loopDetected(message: string | undefined = undefined) {
    throw new LoopDetected(message)
  }

  // 510
  public notExtended(message: string | undefined = undefined) {
    throw new NotExtended(message)
  }

  // 511
  public networkAuthenticationRequired(message: string | undefined = undefined) {
    throw new NetworkAuthenticationRequired(message)
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
  public associations: [typeof PsychicController, typeof DreamSerializer, typeof Dream][] = []

  public add(
    ControllerClass: typeof PsychicController,
    SerializerClass: typeof DreamSerializer,
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
    SerializerClass: typeof DreamSerializer,
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

export type PsychicOpenapiNames<
  T extends PsychicController,
  PsyTypes extends T['psychicTypes'] = T['psychicTypes'],
  OpenapiNames extends PsyTypes['openapiNames'] = PsyTypes['openapiNames'],
  OpenapiName extends OpenapiNames[number] = OpenapiNames[number],
> = OpenapiName
