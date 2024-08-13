import { OpenapiSchemaBody } from '@rvohealth/dream'
import bodyParser from 'body-parser'
import { QueueOptions } from 'bullmq'
import { CorsOptions } from 'cors'
import { Application, Request, Response } from 'express'
import { Socket, Server as SocketServer } from 'socket.io'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import envValue from '../helpers/envValue'
import { OpenapiContent, OpenapiHeaderOption, OpenapiResponses } from '../openapi-renderer/endpoint'
import PsychicRouter from '../router'
import { cachePsychicApplication } from './cache'
import loadControllers, { getControllersOrFail } from './helpers/loadControllers'
import { PsychicRedisConnectionOptions } from './helpers/redisOptions'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'

export default class PsychicApplication {
  public static async init(cb: (app: PsychicApplication) => void | Promise<void>) {
    const psychicApp = new PsychicApplication()
    await cb(psychicApp)
    await psychicApp.inflections?.()
    cachePsychicApplication(psychicApp)
    return psychicApp
  }

  public static async loadControllers(controllersPath: string) {
    return await loadControllers(controllersPath)
  }

  public apiOnly: boolean = false
  public appRoot: string
  public useWs: boolean = false
  public useRedis: boolean = false
  public appName: string = 'untitled app'
  public encryptionKey: string
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
  public routesCb: (r: PsychicRouter) => void | Promise<void>
  public openapi?: PsychicOpenapiOptions
  public client?: PsychicClientOptions
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

  public get authSessionKey() {
    return envValue('AUTH_SESSION_KEY') || 'auth_session'
  }

  public get controllers() {
    return getControllersOrFail()
  }

  public async load(resourceType: 'controllers', resourcePath: string) {
    switch (resourceType) {
      case 'controllers':
        return await loadControllers(resourcePath)
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
        : Opt extends 'appRoot'
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
                          : Opt extends 'saltRounds'
                            ? number
                            : Opt extends 'inflections'
                              ? () => void | Promise<void>
                              : Opt extends 'routes'
                                ? (r: PsychicRouter) => void | Promise<void>
                                : never,
  ) {
    switch (option) {
      case 'appRoot':
        this.appRoot = value as string
        break

      case 'cors':
        this.corsOptions = value as CorsOptions
        break

      case 'cookie':
        this.cookieOptions = { maxAge: cookieMaxAgeFromCookieOpts((value as CustomCookieOptions).maxAge) }
        break

      case 'client':
        this.client = value as PsychicClientOptions
        break

      case 'routes':
        this.routesCb = value as (r: PsychicRouter) => void | Promise<void>
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
  | 'appRoot'
  | 'cors'
  | 'cookie'
  | 'json'
  | 'client'
  | 'background:queue'
  | 'background:worker'
  | 'redis:background'
  | 'redis:ws'
  | 'ssl'
  | 'saltRounds'
  | 'openapi'
  | 'controllers'
  | 'inflections'
  | 'routes'

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

export interface PsychicClientOptions {
  apiPath?: string
}
