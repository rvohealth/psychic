import { DreamApplication, OpenapiSchemaBody } from '@rvohealth/dream'
import bodyParser from 'body-parser'
import { QueueOptions } from 'bullmq'
import { CorsOptions } from 'cors'
import { Application, Request, Response } from 'express'
import { Socket, Server as SocketServer } from 'socket.io'
import PsychicApplicationInitMissingApiRoot from '../error/psychic-application/init-missing-api-root'
import PsychicApplicationInitMissingCallToLoadControllers from '../error/psychic-application/init-missing-call-to-load-controllers'
import PsychicApplicationInitMissingRoutesCallback from '../error/psychic-application/init-missing-routes-callback'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import envValue, { envInt } from '../helpers/envValue'
import { OpenapiContent, OpenapiHeaderOption, OpenapiResponses } from '../openapi-renderer/endpoint'
import PsychicRouter from '../router'
import { cachePsychicApplication, getCachedPsychicApplicationOrFail } from './cache'
import loadControllers, { getControllersOrFail } from './helpers/loadControllers'
import { PsychicRedisConnectionOptions } from './helpers/redisOptions'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'

export default class PsychicApplication {
  public static async init(
    cb: (app: PsychicApplication) => void | Promise<void>,
    dreamCb: (app: DreamApplication) => void | Promise<void>,
  ) {
    let psychicApp: PsychicApplication

    await DreamApplication.init(dreamCb, {}, async dreamApp => {
      psychicApp = new PsychicApplication()
      await cb(psychicApp)

      if (!psychicApp.loadedControllers) throw new PsychicApplicationInitMissingCallToLoadControllers()
      if (!psychicApp.apiRoot) throw new PsychicApplicationInitMissingApiRoot()
      if (!psychicApp.routesCb) throw new PsychicApplicationInitMissingRoutesCallback()

      await psychicApp.inflections?.()

      dreamApp.set('projectRoot', psychicApp.apiRoot)

      cachePsychicApplication(psychicApp)
    })

    return psychicApp!
  }

  /**
   * Returns the cached psychic application if it has been set.
   * If it has not been set, an exception is raised.
   *
   * The psychic application can be set by calling PsychicApplication#init
   */
  public static getOrFail() {
    return getCachedPsychicApplicationOrFail()
  }

  public static async loadControllers(controllersPath: string) {
    return await loadControllers(controllersPath)
  }

  public apiOnly: boolean = false
  public apiRoot: string
  public clientRoot: string
  public useWs: boolean = false
  public useRedis: boolean = false
  public appName: string = 'untitled app'
  public encryptionKey: string
  public port: number = envInt('PORT') || 7777
  public corsOptions: CorsOptions = {}
  public jsonOptions: bodyParser.Options
  public cookieOptions: { maxAge: number }
  public backgroundQueueOptions: Omit<QueueOptions, 'connection'>
  public backgroundWorkerOptions: WorkerOptions
  public redisBackgroundJobCredentials: PsychicRedisConnectionOptions
  public redisWsCredentials: PsychicRedisConnectionOptions
  public sslCredentials?: PsychicSslCredentials
  public saltRounds?: number
  public routesCb: (r: PsychicRouter) => void | Promise<void>
  public openapi: PsychicOpenapiOptions &
    Required<Pick<PsychicOpenapiOptions, 'clientOutputFilename' | 'outputFilename' | 'schemaDelimeter'>> = {
    clientOutputFilename: 'openapi.ts',
    outputFilename: 'openapi.json',
    schemaDelimeter: '',
  }
  public client: Required<PsychicClientOptions> = {
    apiPath: 'src/api',
  }
  public paths: Required<PsychicPathOptions> = {
    controllers: 'src/app/controllers',
    controllerSpecs: 'spec/unit/controllers',
  }
  public inflections?: () => void | Promise<void>
  public bootHooks: Record<
    PsychicHookLoadEventTypes,
    ((conf: PsychicApplication) => void | Promise<void>)[]
  > = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
  }
  public specialHooks: PsychicApplicationSpecialHooks = {
    expressInit: [],
    serverError: [],
    wsStart: [],
    wsConnect: [],
    'after:routes': [],
  }

  protected loadedControllers: boolean = false

  public get authSessionKey() {
    return envValue('AUTH_SESSION_KEY') || 'auth_session'
  }

  public get controllers() {
    return getControllersOrFail()
  }

  public async load(resourceType: 'controllers', resourcePath: string) {
    switch (resourceType) {
      case 'controllers':
        await loadControllers(resourcePath)
        this.loadedControllers = true
        break
    }
  }

  private booted = false
  public async boot(force: boolean = false) {
    if (this.booted && !force) return

    // await new IntegrityChecker().check()

    await this.runHooksFor('load')

    switch (envValue('NODE_ENV')) {
      case 'development':
        await this.runHooksFor('load:dev')
        break

      case 'production':
        await this.runHooksFor('load:prod')
        break

      case 'test':
        await this.runHooksFor('load:test')
        break
    }

    await this.inflections?.()

    this.booted = true
  }

  public on<T extends PsychicHookEventType>(
    hookEventType: T,
    cb: T extends 'server:error'
      ? (err: Error, req: Request, res: Response) => void | Promise<void>
      : T extends 'ws:start'
        ? (server: SocketServer) => void | Promise<void>
        : T extends 'ws:connect'
          ? (socket: Socket) => void | Promise<void>
          : T extends 'server:init'
            ? (app: Application) => void | Promise<void>
            : T extends 'after:routes'
              ? (app: Application) => void | Promise<void>
              : (conf: PsychicApplication) => void | Promise<void>,
  ) {
    switch (hookEventType) {
      case 'server:error':
        this.specialHooks.serverError.push(
          cb as (err: Error, req: Request, res: Response) => void | Promise<void>,
        )
        break

      case 'server:init':
        this.specialHooks.expressInit.push(cb as (app: Application) => void | Promise<void>)
        break

      case 'ws:start':
        this.specialHooks.wsStart.push(cb as (server: SocketServer) => void | Promise<void>)
        break

      case 'ws:connect':
        this.specialHooks.wsConnect.push(cb as (socket: Socket) => void | Promise<void>)
        break

      case 'after:routes':
        this.specialHooks['after:routes'].push(cb as (app: Application) => void | Promise<void>)
        break

      default:
        this.bootHooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: PsychicApplication) => void | Promise<void>,
        )
    }
  }

  public set<Opt extends PsychicApplicationOption>(
    option: Opt,
    value: Opt extends 'cors'
      ? CorsOptions
      : Opt extends 'cookie'
        ? CustomCookieOptions
        : Opt extends 'apiRoot'
          ? string
          : Opt extends 'clientRoot'
            ? string
            : Opt extends 'json'
              ? bodyParser.Options
              : Opt extends 'client'
                ? PsychicClientOptions
                : Opt extends 'background:queue'
                  ? Omit<QueueOptions, 'connection'>
                  : Opt extends 'background:worker'
                    ? WorkerOptions
                    : Opt extends 'redis:background'
                      ? PsychicRedisConnectionOptions
                      : Opt extends 'redis:ws'
                        ? PsychicRedisConnectionOptions
                        : Opt extends 'ssl'
                          ? PsychicSslCredentials
                          : Opt extends 'openapi'
                            ? PsychicOpenapiOptions
                            : Opt extends 'paths'
                              ? PsychicPathOptions
                              : Opt extends 'port'
                                ? number
                                : Opt extends 'saltRounds'
                                  ? number
                                  : Opt extends 'inflections'
                                    ? () => void | Promise<void>
                                    : Opt extends 'routes'
                                      ? (r: PsychicRouter) => void | Promise<void>
                                      : never,
  ) {
    switch (option) {
      case 'apiRoot':
        this.apiRoot = value as string
        break

      case 'clientRoot':
        this.clientRoot = value as string
        break

      case 'cors':
        this.corsOptions = { ...this.corsOptions, ...(value as CorsOptions) }
        break

      case 'cookie':
        this.cookieOptions = {
          ...this.cookieOptions,
          maxAge: cookieMaxAgeFromCookieOpts((value as CustomCookieOptions).maxAge),
        }
        break

      case 'client':
        this.client = { ...this.client, ...(value as PsychicClientOptions) }
        break

      case 'routes':
        this.routesCb = value as (r: PsychicRouter) => void | Promise<void>
        break

      case 'json':
        this.jsonOptions = { ...this.jsonOptions, ...(value as bodyParser.Options) }
        break

      case 'background:queue':
        this.backgroundQueueOptions = {
          ...this.backgroundQueueOptions,
          ...(value as Omit<QueueOptions, 'connection'>),
        }
        break

      case 'background:worker':
        this.backgroundWorkerOptions = { ...this.backgroundWorkerOptions, ...(value as WorkerOptions) }
        break

      case 'redis:background':
        this.redisBackgroundJobCredentials = {
          ...this.redisBackgroundJobCredentials,
          ...(value as PsychicRedisConnectionOptions),
        }
        break

      case 'redis:ws':
        this.redisWsCredentials = { ...this.redisWsCredentials, ...(value as PsychicRedisConnectionOptions) }
        break

      case 'ssl':
        this.sslCredentials = { ...this.sslCredentials, ...(value as PsychicSslCredentials) }
        break

      case 'port':
        this.port = value as number
        break

      case 'saltRounds':
        this.saltRounds = value as number
        break

      case 'openapi':
        this.openapi = { ...this.openapi, ...(value as PsychicOpenapiOptions) }
        break

      case 'paths':
        this.paths = {
          ...this.paths,
          ...(value as PsychicPathOptions),
        }
        break

      case 'inflections':
        this.inflections = value as () => void | Promise<void>
        break

      default:
        throw new Error(`Unhandled option type passed to PsychicApplication#set: ${option}`)
    }
  }

  private async runHooksFor(hookEventType: PsychicHookLoadEventTypes) {
    for (const hook of this.bootHooks[hookEventType]) {
      await hook(this)
    }
  }
}

export type PsychicApplicationOption =
  | 'apiRoot'
  | 'background:queue'
  | 'background:worker'
  | 'client'
  | 'clientRoot'
  | 'controllers'
  | 'cookie'
  | 'cors'
  | 'inflections'
  | 'json'
  | 'openapi'
  | 'paths'
  | 'port'
  | 'redis:background'
  | 'redis:ws'
  | 'routes'
  | 'saltRounds'
  | 'ssl'

export interface PsychicApplicationSpecialHooks {
  expressInit: ((app: Application) => void | Promise<void>)[]
  serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[]
  wsStart: ((server: SocketServer) => void | Promise<void>)[]
  wsConnect: ((socket: Socket) => void | Promise<void>)[]
  ['after:routes']: ((app: Application) => void | Promise<void>)[]
}

export interface CustomCookieOptions {
  maxAge?: CustomCookieMaxAgeOptions
}

export interface CustomCookieMaxAgeOptions {
  milliseconds?: number
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
}

export interface PsychicSslCredentials {
  key: string
  cert: string
}

export interface PsychicOpenapiOptions {
  schemaDelimeter?: string
  outputFilename?: `${string}.json`
  clientOutputFilename?: `${string}.ts`
  suppressResponseEnums?: boolean
  defaults?: {
    headers?: OpenapiHeaderOption[]
    responses?: OpenapiResponses
    components?: {
      [key: string]: {
        [key: string]: OpenapiSchemaBody | OpenapiContent
      }
    }
  }
}

interface PsychicPathOptions {
  controllers?: string
  controllerSpecs?: string
}

export interface PsychicClientOptions {
  apiPath?: string
}
