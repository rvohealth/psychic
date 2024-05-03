import express, { Application, Request, Response } from 'express'
import { Server as SocketServer, Socket } from 'socket.io'
import PsychicController from '../controller'
import PsychicDir from '../helpers/psychicdir'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import Cable from '../cable'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'
import { CorsOptions } from 'cors'
import bodyParser from 'body-parser'
import { QueueOptions } from 'bullmq'
import { PsychicRedisConnectionOptions } from './helpers/redisOptions'
import PsychicIoListener from '../cable/io-listener'

export default class PsychicConfig {
  public static async bootForReading() {
    const psy = new PsychicConfig(express())
    await psy.loadAppConfig()
    return psy
  }

  public app: Application
  public cable?: Cable
  public controllers: { [key: string]: typeof PsychicController } = {}
  public ioListeners: { [key: string]: typeof PsychicIoListener } = {}
  public apiOnly: boolean = false
  public useWs: boolean = false
  public useRedis: boolean = false
  public appName: string = 'untitled app'
  public corsOptions: CorsOptions = {}
  public jsonOptions: bodyParser.Options
  public backgroundQueueOptions: Omit<QueueOptions, 'connection'>
  public backgroundWorkerOptions: WorkerOptions
  public redisBackgroundJobCredentials: PsychicRedisConnectionOptions
  public redisWsCredentials: PsychicRedisConnectionOptions
  public bootHooks: Record<PsychicHookLoadEventTypes, ((conf: PsychicConfig) => void | Promise<void>)[]> = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
    'after:routes': [],
  }
  public specialHooks: PsychicConfigSpecialHooks = {
    serverError: [],
    wsStart: [],
    wsConnect: [],
  }

  constructor(app: Application, { cable }: { cable?: Cable } = {}) {
    this.app = app
    this.cable = cable
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
    return process.env.AUTH_SESSION_KEY || 'auth_session'
  }

  private booted = false
  public async boot() {
    if (this.booted) return

    // await new IntegrityChecker().check()

    await this.runHooksFor('load')

    switch (process.env.NODE_ENV) {
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
      absoluteSrcPath('conf/inflections')
    )
    await inflections()

    this.controllers = await PsychicDir.controllers()
    this.ioListeners = await PsychicDir.ioListeners()
    this.booted = true
  }

  public on<T extends PsychicHookEventType>(
    hookEventType: T,
    cb: T extends 'server_error'
      ? (err: Error, req: Request, res: Response) => void | Promise<void>
      : T extends 'ws:start'
        ? (server: SocketServer) => void | Promise<void>
        : T extends 'ws:connect'
          ? (socket: Socket) => void | Promise<void>
          : (conf: PsychicConfig) => void | Promise<void>
  ) {
    switch (hookEventType) {
      case 'server_error':
        this.specialHooks.serverError.push(
          cb as (err: Error, req: Request, res: Response) => void | Promise<void>
        )
        break

      case 'ws:start':
        this.specialHooks.wsStart.push(cb as (server: SocketServer) => void | Promise<void>)
        break

      case 'ws:connect':
        this.specialHooks.wsConnect.push(cb as (socket: Socket) => void | Promise<void>)
        break

      default:
        this.bootHooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: PsychicConfig) => void | Promise<void>
        )
    }
  }

  public setCorsOptions(options: CorsOptions) {
    this.corsOptions = options
  }

  public setJsonOptions(options: bodyParser.Options) {
    this.jsonOptions = options
  }

  public setBackgroundQueueOptions(options: Omit<QueueOptions, 'connection'>) {
    this.backgroundQueueOptions = options
  }

  public setBackgroundWorkerOptions(options: WorkerOptions) {
    this.backgroundWorkerOptions = options
  }

  public setRedisBackgroundJobCredentials(credentials: PsychicRedisConnectionOptions) {
    this.redisBackgroundJobCredentials = credentials
  }

  public setRedisWsCredentials(credentials: PsychicRedisConnectionOptions) {
    this.redisWsCredentials = credentials
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

    const hooksCB = await importFileWithDefault(absoluteSrcPath('conf/app'))
    if (typeof hooksCB === 'function') {
      await hooksCB(this)
    }
    this.loadedHooks = true
  }
}

export interface PsychicConfigSpecialHooks {
  serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[]
  wsStart: ((server: SocketServer) => void | Promise<void>)[]
  wsConnect: ((socket: Socket) => void | Promise<void>)[]
}
