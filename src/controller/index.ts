import { Dream, DreamSerializer } from 'dream'
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

  public static async background(methodName: string, ...args: any[]) {
    return await background.staticMethod(this, methodName, {
      filepath: `app/controllers/${await (this as typeof PsychicController).controllerPath()}`,
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

  public get params() {
    return {
      ...this.req.params,
      ...this.req.body,
      ...this.req.query,
    }
  }

  public cookie(name: string, data?: any) {
    return this.session.cookie(name, data)
  }

  public async startSession(user: any) {
    return this.cookie(this.config.authSessionKey, {
      id: user.id,
      modelKey: await getModelKey(user.constructor as typeof Dream),
    })
  }

  public async endSession() {
    return this.session.clearCookie(this.config.authSessionKey)
  }

  public json(data: any) {
    let modelForLookup: any | null = null
    if (Array.isArray(data)) {
      if (data[0]?.isDreamInstance) {
        modelForLookup = data[0] as any
      }
    } else if (data?.isDreamInstance) {
      modelForLookup = data as any
    }

    if (modelForLookup) {
      const lookup = controllerSerializerIndex.lookupModel(
        this.constructor as any,
        modelForLookup.constructor
      )

      const SerializerClass = lookup?.[1]
      if (SerializerClass) {
        return this.res.json(
          new SerializerClass(data).passthrough(this.defaultSerializerPassthrough).render()
        )
      } else {
        const modelSerializer = (modelForLookup as Dream).serializer
        if (modelSerializer) {
          return this.res.json(
            new modelSerializer(data).passthrough(this.defaultSerializerPassthrough).render()
          )
        }
      }
    }

    return this.res.json(data)
  }

  protected defaultSerializerPassthrough: { [key: string]: any } = {}
  public serializerPassthrough(passthrough: { [key: string]: any }) {
    this.defaultSerializerPassthrough = {
      ...this.defaultSerializerPassthrough,
      ...passthrough,
    }
  }

  public ok(data: any = {}) {
    return this.json(data)
  }

  public created(data: any = {}) {
    this.res.status(201)
    return this.json(data)
  }

  public accepted(data: any = {}) {
    this.res.status(202)
    return this.json(data)
  }

  public noContent(data: any = {}) {
    this.res.status(204)
    return this.json(data)
  }

  public setStatus(status: number | HttpStatusSymbol) {
    const resolvedStatus =
      status.constructor === Number ? status : parseInt(HttpStatusCodeMap[status] as string)
    return this.res.status(resolvedStatus)
  }

  public send(message: number | HttpStatusSymbol | string) {
    if (message.constructor === Number) {
      return this.res.status(message).send()
    } else {
      const statusLookup = HttpStatusCodeMap[message as any] as string
      if (statusLookup) {
        return this.res.status(parseInt(statusLookup)).send()
      }
    }

    return this.res.send(message)
  }

  public redirect(path: string) {
    return this.res.redirect(path)
  }

  // 400
  public badRequest(data: { [key: string]: any } = {}) {
    throw new BadRequest(
      'The server cannot or will not process the request due to something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).',
      data
    )
  }

  // 422
  public unprocessableEntity(data: { [key: string]: any } = {}) {
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

  // 500
  public internalServerError(data: { [key: string]: any } = {}) {
    throw new InternalServerError(
      'The server has encountered a situation it does not know how to handle.',
      data
    )
  }

  // 501
  public notImplemented(data: { [key: string]: any } = {}) {
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
    await (this as any)[action]()
  }

  public async runBeforeActionsFor(action: string) {
    const beforeActions = (this.constructor as typeof PsychicController).controllerHooks.filter(hook =>
      hook.shouldFireForAction(action)
    )
    for (const hook of beforeActions) {
      if (hook.isStatic) await (this.constructor as any)[hook.methodName]()
      else await (this as any)[hook.methodName]()
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
