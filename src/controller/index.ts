import { DreamModel } from 'dream'
import { Request, Response } from 'express'
import Forbidden from '../error/http/forbidden'
import Unauthorized from '../error/http/unauthorized'
import UnprocessableEntity from '../error/http/unprocessable-entity'
import Session from '../session'
import controllerHooks from '../controller/hooks'
import NotFound from '../error/http/not-found'
import PsychicConfig from '../config'
import PsychicSerializer from '../serializer'
import getControllerKey from '../config/helpers/getControllerKey'
import background from '../background'
import getModelKey from '../config/helpers/getModelKey'

export default class PsychicController {
  public static before(
    methodName: string,
    opts: {
      isStatic?: boolean
      only?: string[]
      except?: string[]
    } = {}
  ) {
    controllerHooks.add(this.name, methodName, opts)
    return this
  }

  public static serializes(ModelClass: DreamModel<any, any>) {
    return {
      with: (SerializerClass: typeof PsychicSerializer) => {
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

  public req: Request
  public res: Response
  public session: Session
  public user: DreamModel<any, any> | null
  public config: PsychicConfig
  constructor(
    req: Request,
    res: Response,
    {
      config,
      user = null,
    }: {
      config: PsychicConfig
      user?: DreamModel<any, any> | null
    }
  ) {
    this.req = req
    this.res = res
    this.config = config
    this.user = user
    this.session = new Session(res)
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
      modelKey: await getModelKey(user.constructor as DreamModel<any, any>),
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
        return this.res.json(new SerializerClass(data).render())
      }
    }

    return this.res.json(data)
  }

  public ok(data: any = {}) {
    return this.json(data)
  }

  public async runAction(action: string) {
    await this.runBeforeActionsFor(action)
    await (this as any)[action]()
  }

  public async runBeforeActionsFor(action: string) {
    const beforeActions = controllerHooks.for(this.constructor.name, action)
    for (const hook of beforeActions) {
      if (hook.isStatic) await (this.constructor as any)[hook.methodName]()
      else await (this as any)[hook.methodName]()
    }
  }

  public authenticate() {
    if (!this.user) this.unauthorized()
  }

  public unprocessableEntity(data: { [key: string]: any } = {}) {
    throw new UnprocessableEntity('The data passed contained an invalid shape', data)
  }

  public unauthorized() {
    throw new Unauthorized('Authorization required')
  }

  public forbidden() {
    throw new Forbidden('Forbidden')
  }

  public notFound() {
    throw new NotFound('The resource you requested could not be found')
  }
}

export class ControllerSerializerIndex {
  public associations: [typeof PsychicController, typeof PsychicSerializer, DreamModel<any, any>][] = []

  public add(
    ControllerClass: typeof PsychicController,
    SerializerClass: typeof PsychicSerializer,
    ModelClass: DreamModel<any, any>
  ) {
    this.associations.push([ControllerClass, SerializerClass, ModelClass])
  }

  public lookupModel(ControllerClass: typeof PsychicController, ModelClass: DreamModel<any, any>) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[2] === ModelClass
    )
  }

  public lookupSerializer(
    ControllerClass: typeof PsychicController,
    SerializerClass: typeof PsychicSerializer
  ) {
    return this.associations.find(
      association => association[0] === ControllerClass && association[1] === SerializerClass
    )
  }
}

export const controllerSerializerIndex = new ControllerSerializerIndex()
