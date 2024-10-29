import {
  DreamApplication,
  DreamLogLevel,
  DreamLogger,
  Encrypt,
  EncryptAlgorithm,
  EncryptOptions,
  OpenapiSchemaBody,
  developmentOrTestEnv,
} from '@rvohealth/dream'
import bodyParser from 'body-parser'
import { QueueOptions } from 'bullmq'
import { CorsOptions } from 'cors'
import { Application, Request, Response } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { Socket, Server as SocketServer } from 'socket.io'
import PsychicApplicationInitMissingApiRoot from '../error/psychic-application/init-missing-api-root'
import PsychicApplicationInitMissingCallToLoadControllers from '../error/psychic-application/init-missing-call-to-load-controllers'
import PsychicApplicationInitMissingRoutesCallback from '../error/psychic-application/init-missing-routes-callback'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import envValue, { envInt } from '../helpers/envValue'
import {
  OpenapiContent,
  OpenapiHeaders,
  OpenapiResponses,
  OpenapiSecurity,
  OpenapiSecuritySchemes,
} from '../openapi-renderer/endpoint'
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

      if (psychicApp.encryption?.cookies?.current)
        this.checkKey(
          'cookies',
          psychicApp.encryption.cookies.current.key,
          psychicApp.encryption.cookies.current.algorithm,
        )

      await psychicApp.inflections?.()

      dreamApp.set('projectRoot', psychicApp.apiRoot)
      dreamApp.set('logger', psychicApp.logger)

      cachePsychicApplication(psychicApp)
    })

    return psychicApp!
  }

  private static checkKey(encryptionIdentifier: 'cookies', key: string, algorithm: EncryptAlgorithm) {
    if (!Encrypt.validateKey(key, algorithm))
      console.warn(
        `
Your current key value for ${encryptionIdentifier} encryption is invalid.
Try setting it to something valid, like:
  ${Encrypt.generateKey(algorithm)}

(This was done by calling:
  Encrypt.generateKey('${algorithm}')
`,
      )
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static log(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.getOrFail().logger.info(...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static logWithLevel(level: DreamLogLevel, ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.getOrFail().logger[level](...args)
  }

  private _apiOnly: boolean = false
  public get apiOnly() {
    return this._apiOnly
  }

  private _apiRoot: string
  public get apiRoot() {
    return this._apiRoot
  }

  private _sessionCookieName: string = 'session'
  public get sessionCookieName() {
    return this._sessionCookieName
  }

  private _backgroundOptions: PsychicBackgroundOptions = {
    workerCount: developmentOrTestEnv() ? 1 : 0,
  }
  public get backgroundOptions() {
    return this._backgroundOptions
  }

  private _clientRoot: string
  public get clientRoot() {
    return this._clientRoot
  }

  private _useWs: boolean = false
  public get useWs() {
    return this._useWs
  }

  private _encryption: PsychicApplicationEncryptionOptions | undefined
  public get encryption() {
    return this._encryption
  }

  private _useRedis: boolean = false
  public get useRedis() {
    return this._useRedis
  }

  private _appName: string = 'untitled app'
  public get appName() {
    return this._appName
  }

  private _port: number = envInt('PORT') || 7777
  public get port() {
    return this._port
  }

  private _corsOptions: CorsOptions = {}
  public get corsOptions() {
    return this._corsOptions
  }

  private _jsonOptions: bodyParser.Options
  public get jsonOptions() {
    return this._jsonOptions
  }

  private _cookieOptions: { maxAge: number }
  public get cookieOptions() {
    return this._cookieOptions
  }

  private _logger: PsychicLogger = console
  public get logger() {
    return this._logger
  }

  private _backgroundQueueOptions: Omit<QueueOptions, 'connection'>
  public get backgroundQueueOptions() {
    return this._backgroundQueueOptions
  }

  private _backgroundWorkerOptions: WorkerOptions
  public get backgroundWorkerOptions() {
    return this._backgroundWorkerOptions
  }

  private _redisBackgroundJobCredentials: PsychicRedisConnectionOptions
  public get redisBackgroundJobCredentials() {
    return this._redisBackgroundJobCredentials
  }

  private _redisWsCredentials: PsychicRedisConnectionOptions
  public get redisWsCredentials() {
    return this._redisWsCredentials
  }

  private _sslCredentials?: PsychicSslCredentials
  public get sslCredentials() {
    return this._sslCredentials
  }

  private _saltRounds?: number
  public get saltRounds() {
    return this._saltRounds
  }

  private _routesCb: (r: PsychicRouter) => void | Promise<void>
  public get routesCb() {
    return this._routesCb
  }

  private _openapi: PsychicOpenapiOptions &
    Required<Pick<PsychicOpenapiOptions, 'clientOutputFilename' | 'outputFilename' | 'schemaDelimeter'>> = {
    clientOutputFilename: 'openapi.ts',
    outputFilename: 'openapi.json',
    schemaDelimeter: '',
  }
  public get openapi() {
    return this._openapi
  }

  private _client: Required<PsychicClientOptions> = {
    apiPath: 'src/api',
  }
  public get client() {
    return this._client
  }

  private _paths: Required<PsychicPathOptions> = {
    apiRoutes: 'src/conf/routes.ts',
    controllers: 'src/app/controllers',
    controllerSpecs: 'spec/unit/controllers',
  }
  public get paths() {
    return this._paths
  }

  private _inflections?: () => void | Promise<void>
  public get inflections() {
    return this._inflections
  }

  private _bootHooks: Record<
    PsychicHookLoadEventTypes,
    ((conf: PsychicApplication) => void | Promise<void>)[]
  > = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
  }
  public get bootHooks() {
    return this._bootHooks
  }

  private _specialHooks: PsychicApplicationSpecialHooks = {
    expressInit: [],
    serverError: [],
    wsStart: [],
    wsConnect: [],
    'after:routes': [],
  }
  public get specialHooks() {
    return this._specialHooks
  }

  private _loadedControllers: boolean = false
  public get loadedControllers() {
    return this._loadedControllers
  }

  public get controllers() {
    return getControllersOrFail()
  }

  public async load(resourceType: 'controllers', resourcePath: string) {
    switch (resourceType) {
      case 'controllers':
        await loadControllers(resourcePath)
        this._loadedControllers = true
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
        this._specialHooks.serverError.push(
          cb as (err: Error, req: Request, res: Response) => void | Promise<void>,
        )
        break

      case 'server:init':
        this._specialHooks.expressInit.push(cb as (app: Application) => void | Promise<void>)
        break

      case 'ws:start':
        this._specialHooks.wsStart.push(cb as (server: SocketServer) => void | Promise<void>)
        break

      case 'ws:connect':
        this._specialHooks.wsConnect.push(cb as (socket: Socket) => void | Promise<void>)
        break

      case 'after:routes':
        this._specialHooks['after:routes'].push(cb as (app: Application) => void | Promise<void>)
        break

      default:
        this.bootHooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: PsychicApplication) => void | Promise<void>,
        )
    }
  }

  public set<Opt extends PsychicApplicationOption>(
    option: Opt,
    value: Opt extends 'appName'
      ? string
      : Opt extends 'useWs'
        ? boolean
        : Opt extends 'useRedis'
          ? boolean
          : Opt extends 'apiOnly'
            ? boolean
            : Opt extends 'encryption'
              ? PsychicApplicationEncryptionOptions
              : Opt extends 'cors'
                ? CorsOptions
                : Opt extends 'cookie'
                  ? CustomCookieOptions
                  : Opt extends 'apiRoot'
                    ? string
                    : Opt extends 'sessionCookieName'
                      ? string
                      : Opt extends 'background'
                        ? PsychicBackgroundOptions
                        : Opt extends 'clientRoot'
                          ? string
                          : Opt extends 'json'
                            ? bodyParser.Options
                            : Opt extends 'logger'
                              ? PsychicLogger
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
      case 'appName':
        this._appName = value as string
        break

      case 'useWs':
        this._useWs = value as boolean
        break

      case 'useRedis':
        this._useRedis = value as boolean
        break

      case 'apiOnly':
        this._apiOnly = value as boolean
        break

      case 'apiRoot':
        this._apiRoot = value as string
        break

      case 'clientRoot':
        this._clientRoot = value as string
        break

      case 'sessionCookieName':
        this._sessionCookieName = value as string
        break

      case 'encryption':
        this._encryption = value as PsychicApplicationEncryptionOptions
        break

      case 'cors':
        this._corsOptions = { ...this.corsOptions, ...(value as CorsOptions) }
        break

      case 'cookie':
        this._cookieOptions = {
          ...this.cookieOptions,
          maxAge: cookieMaxAgeFromCookieOpts((value as CustomCookieOptions).maxAge),
        }
        break

      case 'client':
        this._client = { ...this.client, ...(value as PsychicClientOptions) }
        break

      case 'routes':
        this._routesCb = value as (r: PsychicRouter) => void | Promise<void>
        break

      case 'json':
        this._jsonOptions = { ...this.jsonOptions, ...(value as bodyParser.Options) }
        break

      case 'logger':
        this._logger = value as PsychicLogger
        break

      case 'background':
        this._backgroundOptions = { ...this._backgroundOptions, ...(value as PsychicBackgroundOptions) }
        break

      case 'background:queue':
        this._backgroundQueueOptions = {
          ...this.backgroundQueueOptions,
          ...(value as Omit<QueueOptions, 'connection'>),
        }
        break

      case 'background:worker':
        this._backgroundWorkerOptions = { ...this.backgroundWorkerOptions, ...(value as WorkerOptions) }
        break

      case 'redis:background':
        this._redisBackgroundJobCredentials = {
          ...this.redisBackgroundJobCredentials,
          ...(value as PsychicRedisConnectionOptions),
        }
        break

      case 'redis:ws':
        this._redisWsCredentials = { ...this.redisWsCredentials, ...(value as PsychicRedisConnectionOptions) }
        break

      case 'ssl':
        this._sslCredentials = { ...this.sslCredentials, ...(value as PsychicSslCredentials) }
        break

      case 'port':
        this._port = value as number
        break

      case 'saltRounds':
        this._saltRounds = value as number
        break

      case 'openapi':
        this._openapi = { ...this.openapi, ...(value as PsychicOpenapiOptions) }
        break

      case 'paths':
        this._paths = {
          ...this.paths,
          ...(value as PsychicPathOptions),
        }
        break

      case 'inflections':
        this._inflections = value as () => void | Promise<void>
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
  | 'appName'
  | 'useWs'
  | 'useRedis'
  | 'apiOnly'
  | 'apiRoot'
  | 'encryption'
  | 'sessionCookieName'
  | 'background'
  | 'background:queue'
  | 'background:worker'
  | 'client'
  | 'clientRoot'
  | 'cookie'
  | 'cors'
  | 'inflections'
  | 'json'
  | 'logger'
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
  validation?: Partial<Parameters<(typeof OpenApiValidator)['middleware']>[0]>
  defaults?: {
    headers?: OpenapiHeaders
    responses?: OpenapiResponses
    securitySchemes?: OpenapiSecuritySchemes
    security?: OpenapiSecurity
    components?: {
      [key: string]: {
        [key: string]: OpenapiSchemaBody | OpenapiContent
      }
    }
  }
}

interface PsychicPathOptions {
  apiRoutes?: string
  controllers?: string
  controllerSpecs?: string
}

interface PsychicBackgroundOptions {
  workerCount: number
}

export interface PsychicClientOptions {
  apiPath?: string
}

export type PsychicLogger = DreamLogger
export type PsychicLogLevel = DreamLogLevel

export interface PsychicApplicationEncryptionOptions {
  cookies: SegmentedEncryptionOptions
}
interface SegmentedEncryptionOptions {
  current: EncryptOptions
  legacy?: EncryptOptions
}
