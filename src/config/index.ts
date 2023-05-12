import fs from 'fs'
import { Application } from 'express'
import PsychicController from '../controller'
import PsychicDir from '../helpers/psychicdir'
import readAppConfig from './helpers/readAppConfig'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'

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

  public async boot() {
    // await new IntegrityChecker().check()

    const appConfig = await importFileWithDefault(absoluteSrcPath('conf/env/all.ts'))
    await appConfig(this)

    switch (process.env.NODE_ENV) {
      case 'development':
        const devConfig = await importFileWithDefault(absoluteSrcPath('conf/env/dev.ts'))
        await devConfig(this)
        break

      case 'production':
        const prodConfig = await importFileWithDefault(absoluteSrcPath('conf/env/prod.ts'))
        await prodConfig(this)
        break

      case 'test':
        const testConfig = await importFileWithDefault(absoluteSrcPath('conf/env/testing.ts'))
        await testConfig(this)
        break
    }

    const inflections = await importFileWithDefault(absoluteSrcPath('conf/inflections.ts'))
    await inflections()

    this.controllers = await PsychicDir.controllers()
  }
}
