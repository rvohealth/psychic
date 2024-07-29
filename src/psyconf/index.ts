import bodyParser from 'body-parser'
import { QueueOptions } from 'bullmq'
import { CorsOptions } from 'cors'
import { Application, Request, Response } from 'express'
import { Socket, Server as SocketServer } from 'socket.io'
import PsychicController from '../controller'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import envValue from '../helpers/envValue'
import importFileWithDefault from '../helpers/importFileWithDefault'
import PsychicDir from '../helpers/psychicdir'
import { cachePsyconf, getCachedPsyconf } from './cache'
import { PsychicRedisConnectionOptions } from './helpers/redisOptions'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'
import { Dreamconf } from '@rvohealth/dream'

export default class Psyconf {
  /**
   * If a psychic config has already been cached, it will
   * be returned. Otherwise, a new psychic config is cached,
   * with all relevant hooks applied.
   */
  public static async configure(): Promise<Psyconf> {
    await Dreamconf.configure()

    const cachedPsyconf = getCachedPsyconf()
    if (cachedPsyconf) return cachedPsyconf
    return await this.reconfigure()
  }

  /**
   * @internal
   *
   * Blows away the cached psychic config, providing
   * a new one, with all hooks re-run. This is usually
   * only necessary in tests, where env vars may be
   * changing around between test runs, and you need
   * the configuration to rebuild
   */
  public static async reconfigure(): Promise<Psyconf> {
    const psyconf = new Psyconf()
    await psyconf.loadAppConfig()
    return psyconf
  }

  public controllers: { [key: string]: typeof PsychicController } = {}
  public apiOnly: boolean = false
  public useWs: boolean = false
  public useRedis: boolean = false
  public appName: string = 'untitled app'
  public port?: number
  public corsOptions: CorsOptions = {}
  public jsonOptions: bodyParser.Options
  public cookieOptions: { maxAge: number }
  public backgroundQueueOptions: Omit<QueueOptions, 'connection'>
  public backgroundWorkerOptions: WorkerOptions
  public redisBackgroundJobCredentials: PsychicRedisConnectionOptions
  public redisWsCredentials: PsychicRedisConnectionOptions
  public sslCredentials?: PsychicSslCredentials
  public saltRounds?: number
  public openapi?: PsychicOpenapiOptions
  public bootHooks: Record<PsychicHookLoadEventTypes, ((conf: Psyconf) => void | Promise<void>)[]> = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
    'after:routes': [],
  }
  public specialHooks: PsyconfSpecialHooks = {
    expressInit: [],
    serverError: [],
    wsStart: [],
    wsConnect: [],
  }

  public get appPath() {
    return absoluteSrcPath('app')
  }

  public get confPath() {
    return absoluteSrcPath('conf')
  }

  public get dbPath() {
    return absoluteSrcPath('db')
  }

  public get migrationsPath() {
    return absoluteSrcPath('db/migrations')
  }

  public get controllersPath() {
    return absoluteSrcPath('app/controllers')
  }

  public get modelsPath() {
    return absoluteSrcPath('app/models')
  }

  public get servicesPath() {
    return absoluteSrcPath('app/services')
  }

  public get authSessionKey() {
    return envValue('AUTH_SESSION_KEY') || 'auth_session'
  }

  private booted = false
  public async boot() {
    if (this.booted) return

    await this.loadAppConfig()

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

    const inflections = await importFileWithDefault<() => void | Promise<void>>(
      absoluteSrcPath('conf/inflections'),
    )
    await inflections()

    this.controllers = await PsychicDir.controllers()
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
            : (conf: Psyconf) => void | Promise<void>,
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

      default:
        this.bootHooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: Psyconf) => void | Promise<void>,
        )
    }
  }

  public set<Opt extends PsyconfOption>(
    option: Opt,
    value: Opt extends 'cors'
      ? CorsOptions
      : Opt extends 'cookie'
        ? CustomCookieOptions
        : Opt extends 'json'
          ? bodyParser.Options
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
                      : Opt extends 'saltRounds'
                        ? number
                        : never,
  ) {
    switch (option) {
      case 'cors':
        this.corsOptions = value as CorsOptions
        break

      case 'cookie':
        this.cookieOptions = { maxAge: cookieMaxAgeFromCookieOpts((value as CustomCookieOptions).maxAge) }
        break

      case 'json':
        this.jsonOptions = value as bodyParser.Options
        break

      case 'background:queue':
        this.backgroundQueueOptions = value as Omit<QueueOptions, 'connection'>
        break

      case 'background:worker':
        this.backgroundWorkerOptions = value as WorkerOptions
        break

      case 'redis:background':
        this.redisBackgroundJobCredentials = value as PsychicRedisConnectionOptions
        break

      case 'redis:ws':
        this.redisWsCredentials = value as PsychicRedisConnectionOptions
        break

      case 'ssl':
        this.sslCredentials = value as PsychicSslCredentials
        break

      case 'saltRounds':
        this.saltRounds = value as number
        break

      case 'openapi':
        this.openapi = value as PsychicOpenapiOptions
        break

      default:
        throw new Error(`Unhandled option type passed to Psyconf#set: ${option}`)
    }
  }

  private async runHooksFor(hookEventType: PsychicHookLoadEventTypes) {
    await this.loadAppConfig()

    for (const hook of this.bootHooks[hookEventType]) {
      await hook(this)
    }
  }

  private loadedHooks = false
  private async loadAppConfig() {
    if (this.loadedHooks) return

    try {
      const hooksCB = await importFileWithDefault(absoluteSrcPath('conf/app'))
      if (typeof hooksCB === 'function') {
        await hooksCB(this)
      }
    } catch (err) {
      // ts-node will bury this error, preventing us from being able to see it
      // unless we manually console log the error ourselves.
      console.error('an error occurred while attempting to import conf/app.ts:', err)
      throw err
    }

    cachePsyconf(this)
    this.loadedHooks = true
  }
}

export type PsyconfOption =
  | 'cors'
  | 'cookie'
  | 'json'
  | 'background:queue'
  | 'background:worker'
  | 'redis:background'
  | 'redis:ws'
  | 'ssl'
  | 'saltRounds'
  | 'openapi'

export interface PsyconfSpecialHooks {
  expressInit: ((app: Application) => void | Promise<void>)[]
  serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[]
  wsStart: ((server: SocketServer) => void | Promise<void>)[]
  wsConnect: ((socket: Socket) => void | Promise<void>)[]
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
}
