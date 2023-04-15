import * as fs from 'fs'
import { Application } from 'express'
import PsychicController from '../controller'
import PsychicDir from '../helpers/howldir'
import readAppConfig from './helpers/readAppConfig'

export default class PsychicConfig {
  public app: Application
  public controllers: { [key: string]: typeof PsychicController } = {}
  public apiOnly: boolean = false
  public useWs: boolean = false
  public useRedis: boolean = false
  public useUUIDs: boolean = false
  constructor(app: Application) {
    this.app = app

    const ymlConfig = readAppConfig()
    if (!ymlConfig) throw `Failed to read yaml config`

    if (ymlConfig.ws) this.useWs = true
    if (ymlConfig.redis) this.useRedis = true
    if (ymlConfig.api_only) this.apiOnly = true
    if (ymlConfig.use_uuids) this.useUUIDs = true
  }

  public get root() {
    if (process.env.CORE_DEVELOPMENT === '1') return __dirname + '/../../test-app'
    return __dirname + '/../../../../../src'
  }

  public get appPath() {
    return this.root + '/app'
  }

  public get confPath() {
    return this.root + '/conf'
  }

  public get dbPath() {
    return this.root + '/db'
  }

  public get migrationsPath() {
    return this.dbPath + '/migrations'
  }

  public get controllersPath() {
    return this.appPath + '/controllers'
  }

  public get modelsPath() {
    return this.appPath + '/models'
  }

  public get servicesPath() {
    return this.appPath + '/services'
  }

  public get authSessionKey() {
    return process.env.AUTH_SESSION_KEY || 'auth_session'
  }

  public async boot() {
    // await new IntegrityChecker().check()

    const appConfig = await import(this.confPath + '/env/all.ts')
    await appConfig.default(this)

    switch (process.env.NODE_ENV) {
      case 'development':
        const devConfig = await import(this.confPath + '/env/dev.ts')
        await devConfig.default(this)
        break

      case 'production':
        const prodConfig = await import(this.confPath + '/env/prod.ts')
        await prodConfig.default(this)
        break

      case 'test':
        const testConfig = await import(this.confPath + '/env/testing.ts')
        await testConfig.default(this)
        break
    }

    const inflections = await import(this.confPath + '/inflections.ts')
    await inflections.default()

    this.controllers = await PsychicDir.controllers()
  }
}
