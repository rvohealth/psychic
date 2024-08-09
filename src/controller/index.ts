import { Dream, DreamParamSafeAttributes, DreamSerializer } from '@rvohealth/dream'
import { Request, Response } from 'express'
import background from '../background'
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
import Psyconf from '../psyconf'
import getControllerKey from '../psyconf/helpers/getControllerKey'
import getModelKey from '../psyconf/helpers/getModelKey'
import Params, {
  ParamsCastOptions,
  ParamsForOpts,
  ParamValidationError,
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
  public static get isPsychicController() {
    return true
  }

  public static controllerHooks: ControllerHook[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static openapi: Record<string, OpenapiEndpointRenderer<any>>

  public static serializes(ModelClass: typeof Dream) {
    return {
      with: (SerializerClass: typeof DreamSerializer) => {
        controllerSerializerIndex.add(this, SerializerClass, ModelClass)
        return this
      },
    }
  }

  public static async controllerPath() {
    return await getControllerKey(this)
  }

  public static async controllerActionPath(methodName: string) {
    return `${(await this.controllerPath()).replace(/Controller$/, '')}#${methodName.toString()}`
  }

  public static async background(
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) {
    return await background.staticMethod(this, methodName, {
      filepath: `app/controllers/${await this.controllerPath()}`,
      args,
    })
  }

  public static async backgroundWithDelay(
    delaySeconds: number,
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) {
    return await background.staticMethod(this, methodName, {
      delaySeconds,
      filepath: `app/controllers/${await this.controllerPath()}`,
      args,
    })
  }

  public get isPsychicControllerInstance() {
    return true
  }

  public req: Request
  public res: Response
  public session: Session
  public config: Psyconf
  public action: string
  constructor(
    req: Request,
    res: Response,
    {
      config,
      action,
    }: {
      config: Psyconf
      action: string
    },
  ) {
    this.req = req
    this.res = res
    this.config = config
    this.session = new Session(req, res, this.config)
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
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp,
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
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp,
    ValidatedType extends ValidatedReturnType<ExpectedType>,
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
      opts?.key ? (this.params[opts.key] as typeof this.params) : this.params,
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

  public async startSession(user: Dream) {
    return this.setCookie(
      this.config.authSessionKey,
      JSON.stringify({
        id: user.primaryKeyValue,
        modelKey: await getModelKey(user.constructor as typeof Dream),
      }),
    )
  }

  public endSession() {
    return this.session.clearCookie(this.config.authSessionKey)
  }

  private singleObjectJson<T>(data: T, opts: RenderOptions<T>): T | SerializerResult {
    if (!data) return data

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const lookup = controllerSerializerIndex.lookupModel(this.constructor as any, (data as any).constructor)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const SerializerClass = lookup?.[1] || (data as any).serializers?.[opts.serializerKey || 'default']
    if (SerializerClass) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return new SerializerClass(data).passthrough(this.defaultSerializerPassthrough).render()
    }

    return data
  }

  public json<T>(
    data: T,
    opts: RenderOptions<T> = {},
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

  public respond<T>(data: T = {} as T, opts: RenderOptions<T> = {}) {
    const openapiData = (this.constructor as typeof PsychicController).openapi[this.action]
    this.res.status(openapiData?.['status'] || 200)

    this.json(data, opts)
  }

  public ok<T>(data: T = {} as T, opts: RenderOptions<T> = {}) {
    this.json(data, opts)
  }

  public created<T>(data: T = {} as T, opts: RenderOptions<T> = {}) {
    this.res.status(201)
    this.json(data, opts)
  }

  public accepted<T>(data: T = {} as T, opts: RenderOptions<T> = {}) {
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

export type RenderOptions<
  T,
  U = T extends (infer R)[] ? R : T,
  SerializerType = U extends null
    ? never
    : U['serializers' & keyof U] extends object
      ? keyof U['serializers' & keyof U]
      : never,
> = { serializerKey?: SerializerType }

export const controllerSerializerIndex = new ControllerSerializerIndex()
