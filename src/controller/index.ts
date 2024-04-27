import { Dream, DreamSerializer } from '@rvohealth/dream'
import { Request, Response } from 'express'
import Forbidden from '../error/http/forbidden'
import Unauthorized from '../error/http/unauthorized'
import UnprocessableEntity from '../error/http/unprocessable-entity'
import Session from '../session'
import NotFound from '../error/http/not-found'
import PsychicConfig from '../config'
import getControllerKey from '../config/helpers/getControllerKey'
import background from '../background'
import getModelKey from '../config/helpers/getModelKey'
import BadRequest from '../error/http/bad-request'
import InternalServerError from '../error/http/internal-server-error'
import ServiceUnavailable from '../error/http/service-unavailable'
import HttpStatusCodeMap, { HttpStatusSymbol } from '../error/http/status-codes'
import { ControllerHook } from '../controller/hooks'
import Conflict from '../error/http/conflict'
import Params from '../server/params'

type SerializerResult = {
  [key: string]: // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
}

export type PsychicParamsPrimitive = string | number | boolean | null | PsychicParamsPrimitive[]

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

export default class PsychicController {
  public static get isPsychicController() {
    return true
  }

  public static controllerHooks: ControllerHook[] = []

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
  public config: PsychicConfig
  constructor(
    req: Request,
    res: Response,
    {
      config,
    }: {
      config: PsychicConfig
    }
  ) {
    this.req = req
    this.res = res
    this.config = config
    this.session = new Session(req, res)
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

  public paramsFor<DreamClass extends typeof Dream>(dreamClass: DreamClass, key?: string) {
    return Params.for(key ? (this.params[key] as typeof this.params) : this.params, dreamClass)
  }

  public cookie(name: string, data?: string) {
    return this.session.cookie(name, data)
  }

  public async startSession(user: Dream) {
    return this.cookie(
      this.config.authSessionKey,
      JSON.stringify({
        id: user.primaryKeyValue,
        modelKey: await getModelKey(user.constructor as typeof Dream),
      })
    )
  }

  public endSession() {
    return this.session.clearCookie(this.config.authSessionKey)
  }

  private singleObjectJson<T>(data: T): T | SerializerResult {
    if (!data) return data

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const lookup = controllerSerializerIndex.lookupModel(this.constructor as any, (data as any).constructor)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const SerializerClass = lookup?.[1] || (data as any).serializer
    if (SerializerClass) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return new SerializerClass(data).passthrough(this.defaultSerializerPassthrough).render()
    }

    return data
  }

  public json(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any {
    if (Array.isArray(data))
      return this.res.json(
        data.map(d =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          this.singleObjectJson(d)
        )
      )
    return this.res.json(this.singleObjectJson(data))
  }

  protected defaultSerializerPassthrough: SerializerResult = {}
  public serializerPassthrough(passthrough: SerializerResult) {
    this.defaultSerializerPassthrough = {
      ...this.defaultSerializerPassthrough,
      ...passthrough,
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public ok(data: any = {}) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.json(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public created(data: any = {}) {
    this.res.status(201)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.json(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public accepted(data: any = {}) {
    this.res.status(202)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.json(data)
  }

  public noContent() {
    return this.res.sendStatus(204)
  }

  public setStatus(status: number | HttpStatusSymbol) {
    const resolvedStatus =
      status.constructor === Number ? status : parseInt(HttpStatusCodeMap[status] as string)
    return this.res.status(resolvedStatus)
  }

  public send(message: number | HttpStatusSymbol) {
    if (message.constructor === Number) {
      return this.res.status(message).send()
    } else {
      const statusLookup = HttpStatusCodeMap[message as HttpStatusSymbol]
      if (typeof statusLookup === 'string') {
        return this.res.status(parseInt(statusLookup)).send()
      }
    }

    return this.res.send(message)
  }

  public redirect(path: string) {
    return this.res.redirect(path)
  }

  // 400
  public badRequest(data: SerializerResult = {}) {
    throw new BadRequest(
      'The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).',
      data
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
      data
    )
  }

  // 501
  public notImplemented(data: SerializerResult = {}) {
    throw new InternalServerError(
      'The request method is not supported by the server and cannot be handled. The only methods that servers are required to support (and therefore that must not return this code) are GET and HEAD',
      data
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
      hook.shouldFireForAction(action)
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
    ModelClass: typeof Dream
  ) {
    this.associations.push([ControllerClass, SerializerClass, ModelClass])
  }

  public lookupModel(ControllerClass: typeof PsychicController, ModelClass: typeof Dream) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[2] === ModelClass
    )
  }

  public lookupSerializer(
    ControllerClass: typeof PsychicController,
    SerializerClass: typeof DreamSerializer
  ) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[1] === SerializerClass
    )
  }
}

export const controllerSerializerIndex = new ControllerSerializerIndex()
