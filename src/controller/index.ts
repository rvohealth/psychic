import {
  Dream,
  DreamApplication,
  DreamParamSafeAttributes,
  DreamSerializer,
  GlobalNameNotSet,
} from '@rvohealth/dream'
import { Request, Response } from 'express'
import { ControllerHook } from '../controller/hooks'
import BadRequest from '../error/http/bad-request'
import Conflict from '../error/http/conflict'
import Forbidden from '../error/http/forbidden'
import InternalServerError from '../error/http/internal-server-error'
import NotFound from '../error/http/not-found'
import ServiceUnavailable from '../error/http/service-unavailable'
import HttpStatusCodeMap, { HttpStatusSymbol } from '../error/http/status-codes'
import Unauthorized from '../error/http/unauthorized'
import UnprocessableEntity from '../error/http/unprocessable-entity'
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

type SerializerResult = {
  [key: string]: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
}

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

  public getCookie(name: string) {
    return this.session.getCookie(name)
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
        (data as any).serializers?.[opts.serializerKey || 'default'] as string | undefined

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

  public ok<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.json(data, opts)
  }

  public created<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(201)
    this.json(data, opts)
  }

  public accepted<T>(data: T = {} as T, opts: RenderOptions = {}) {
    this.res.status(202)
    this.json(data, opts)
  }

  public noContent() {
    this.res.sendStatus(204)
  }

  public setStatus(status: number | HttpStatusSymbol) {
    const resolvedStatus =
      status.constructor === Number ? status : parseInt(HttpStatusCodeMap[status] as string)
    this.res.status(resolvedStatus)
  }

  public send(message: number | HttpStatusSymbol) {
    if (typeof message === 'number') {
      this.res.status(message).send()
    } else {
      const statusLookup = HttpStatusCodeMap[message]
      if (typeof statusLookup === 'string') {
        this.res.status(parseInt(statusLookup)).send()
      } else {
        this.res.send(message)
      }
    }
  }

  public redirect(path: string) {
    this.res.redirect(path)
  }

  // 400
  public badRequest(data: SerializerResult = {}) {
    throw new BadRequest(
      'The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).',
      data,
    )
  }

  // 422
  public unprocessableEntity(data: SerializerResult = {}) {
    throw new UnprocessableEntity('The data passed contained an invalid shape', data)
  }

  // 401
  public unauthorized() {
    throw new Unauthorized('Authorization required')
  }

  // 403
  public forbidden() {
    throw new Forbidden('Forbidden')
  }

  // 404
  public notFound() {
    throw new NotFound('The resource you requested could not be found')
  }

  // 409
  public conflict() {
    throw new Conflict('A conflcit was detected while processing your request')
  }

  // 500
  public internalServerError(data: SerializerResult = {}) {
    throw new InternalServerError(
      'The server has encountered a situation it does not know how to handle.',
      data,
    )
  }

  // 501
  public notImplemented(data: SerializerResult = {}) {
    throw new InternalServerError(
      'The request method is not supported by the server and cannot be handled. The only methods that servers are required to support (and therefore that must not return this code) are GET and HEAD',
      data,
    )
  }

  // 503
  public serviceUnavailable() {
    throw new ServiceUnavailable('The service you requested is currently unavailable')
  }

  public async runAction(action: string) {
    await this.runBeforeActionsFor(action)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    await (this as any)[action]()
  }

  public async runBeforeActionsFor(action: string) {
    const beforeActions = (this.constructor as typeof PsychicController).controllerHooks.filter(hook =>
      hook.shouldFireForAction(action),
    )

    for (const hook of beforeActions) {
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

// Since Dream explicitly types the return type of
// the serializers getter as, e.g., DreamSerializers<User>,
// in order to enforce valid serializer global names as the
// values of the serializers object, we can't make the
// serializers object into a const and therefore can't
// leverage the key values to enforce a valid serializerKey
export type RenderOptions = { serializerKey?: string }

export const controllerSerializerIndex = new ControllerSerializerIndex()
