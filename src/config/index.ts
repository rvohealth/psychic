import { Application, Request, Response } from 'express'
import PsychicController from '../controller'
import PsychicDir from '../helpers/psychicdir'
import readAppConfig from './helpers/readAppConfig'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import Cable from '../cable'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'

export default class PsychicConfig {
  public static async build(app: Application, { cable }: { cable?: Cable } = {}) {
    const conf = new PsychicConfig(app, { cable })

    const hooksCB = await importFileWithDefault(absoluteSrcPath('conf/hooks'))
    if (typeof hooksCB === 'function') {
      hooksCB(conf)
    }
  }

  public app: Application
  public cable?: Cable
  public controllers: { [key: string]: typeof PsychicController } = {}
  public apiOnly: boolean = false
  public useWs: boolean = false
  public useRedis: boolean = false
  public hooks: Record<PsychicHookLoadEventTypes, ((conf: PsychicConfig) => void | Promise<void>)[]> = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
    'after:routes': [],
  }
  public serverErrorHooks: ((err: any, req: Request, res: Response) => void | Promise<void>)[] = []

  constructor(app: Application, { cable }: { cable?: Cable } = {}) {
    this.app = app
    this.cable = cable

    const ymlConfig = readAppConfig()
    if (!ymlConfig) throw new Error(`Failed to read psychic yaml config`)

    if (ymlConfig.ws) this.useWs = true
    if (ymlConfig.redis) this.useRedis = true
    if (ymlConfig.api_only) this.apiOnly = true
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

    const inflections = await importFileWithDefault(absoluteSrcPath('conf/inflections'))
    await inflections()

    this.controllers = await PsychicDir.controllers()
    this.booted = true
  }

  public on<T extends PsychicHookEventType>(
    hookEventType: T,
    cb: T extends 'server_error'
      ? (err: any, req: Request, res: Response) => void | Promise<void>
      : (conf: PsychicConfig) => void | Promise<void>
  ) {
    switch (hookEventType) {
      case 'server_error':
        this.serverErrorHooks.push(cb as (conf: PsychicConfig) => void | Promise<void>)

        break

      default:
        this.hooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: PsychicConfig) => void | Promise<void>
        )
    }
  }

  private async runHooksFor(hookEventType: PsychicHookLoadEventTypes) {
    await this.loadHooks()

    for (const hook of this.hooks[hookEventType]) {
      await hook(this)
    }
  }

  private loadedHooks = false
  private async loadHooks() {
    if (this.loadedHooks) return

    const hooksCB = await importFileWithDefault(absoluteSrcPath('conf/hooks'))
    if (typeof hooksCB === 'function') {
      hooksCB(this)
    }
    this.loadedHooks = true
  }
}
