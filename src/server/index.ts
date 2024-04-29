import { loadModels, closeAllDbConnections } from '@rvohealth/dream'
import express from 'express'
import { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import PsychicConfig from '../config'
import Cable from '../cable'
import FrontEndClientServer from './front-end-client'
import PsychicRouter from '../router'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import { Server } from 'http'
import startPsychicServer from './helpers/startPsychicServer'
import { stopBackgroundWorkers } from '../background'

export default class PsychicServer {
  public app: Application
  public cable: Cable
  public config: PsychicConfig
  public frontEndClient: FrontEndClientServer
  public server: Server
  private booted = false
  constructor() {
    this.buildApp()
    this.config = new PsychicConfig(this.app)
  }

  public async routes() {
    const r = new PsychicRouter(this.app, this.config)
    const routesPath = absoluteSrcPath('conf/routes')
    const routesCB = await importFileWithDefault<(router: PsychicRouter) => Promise<void>>(routesPath)
    await routesCB(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

    await this.config['loadAppConfig']()
    await this.config['runHooksFor']('boot')

    this.initializeCors()
    this.initializeJSON()

    try {
      await this.config.boot()
    } catch (err) {
      const error = err as Error
      console.error(error)
      throw new Error(`
        Failed to boot psychic config. the error thrown was:
          ${error.message}
      `)
    }

    await this.buildRoutes()

    await this.config['runHooksFor']('after:routes')

    if (this.config.useWs) {
      this.cable = new Cable(this.app, this.config)

      for (const hook of this.config.specialHooks.wsInit) {
        await hook(this.cable.io!)
      }
    }

    this.config.cable = this.cable

    this.booted = true
    return true
  }

  // TODO: use config helper for fetching default port
  public async start(
    port = process.env.PORT ? parseInt(process.env.PORT) : 7777,
    {
      withFrontEndClient = process.env.CLIENT === '1',
      frontEndPort = 3000,
    }: {
      withFrontEndClient?: boolean
      frontEndPort?: number
    } = {}
  ) {
    await this.boot()

    // ensure models are loaded, since otherwise we will not properly
    // boot our STI configurations within dream
    await loadModels()

    if (withFrontEndClient) {
      this.frontEndClient = new FrontEndClientServer()
      this.frontEndClient.start(frontEndPort)

      process.on('SIGTERM', () => {
        this.frontEndClient?.stop()
      })
    }

    if (this.config.useWs && this.cable) {
      // cable starting will also start
      // an encapsulating http server
      await this.cable.start(port, { withFrontEndClient, frontEndPort })
      this.server = this.cable.http
    } else {
      await new Promise(accept => {
        startPsychicServer({
          app: this.app,
          port,
          withFrontEndClient,
          frontEndPort,
        })
          .then(server => {
            this.server = server
            accept({})
          })
          .catch(() => {})
      })
    }

    return true
  }

  public async stop() {
    this.server?.close()
    await stopBackgroundWorkers()
    await closeAllDbConnections()
  }

  public async serveForRequestSpecs(block: () => void | Promise<void>) {
    const port = process.env.PORT
    if (!port) throw 'Missing `PORT` environment variable'

    await this.boot()

    let server: Server

    await new Promise(accept => {
      server = this.app.listen(port, () => accept({}))
    })

    await block()

    server!.close()

    return true
  }

  public buildApp() {
    this.app = express()
    this.app.use(cookieParser())
  }

  private initializeCors() {
    this.app.use(cors(this.config.corsOptions))
  }

  private initializeJSON() {
    this.app.use(express.json(this.config.jsonOptions))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.app, this.config)
    const routesPath = absoluteSrcPath('conf/routes')
    const routesCB = await importFileWithDefault<(router: PsychicRouter) => Promise<void>>(routesPath)
    await routesCB(r)
    r.commit()
  }
}
