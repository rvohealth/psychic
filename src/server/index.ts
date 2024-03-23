import { loadModels, closeAllDbConnections, dreamDbConnections } from '@rvohealth/dream'
import express from 'express'
import { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import PsychicConfig from '../config'
import log from '../log'
import Cable from '../cable'
import FrontEndClientServer from './front-end-client'
import PsychicRouter from '../router'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import { Server } from 'http'
import startPsychicServer from './helpers/startPsychicServer'
import background, { stopBackgroundWorkers } from '../background'

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
    const routesCB = await importFileWithDefault(routesPath)
    await routesCB(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return
    this.booted = true

    const bootCB = await importFileWithDefault(absoluteSrcPath('conf/hooks/boot'))
    await bootCB(this.config)

    await this.initializeCors()
    await this.initializeJSON()

    try {
      await this.config.boot()
    } catch (err) {
      console.error(err)
      throw `
        Failed to boot psychic config. the error thrown was:
          ${err}
      `
    }

    await this.buildRoutes()

    const afterRoutesCB = await importFileWithDefault(absoluteSrcPath('conf/hooks/after-routes'))
    await afterRoutesCB(this.config)

    if (this.config.useWs) this.cable = new Cable(this.app)
    this.config.cable = this.cable

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

      process.on('SIGTERM', async () => {
        await this.frontEndClient?.stop()
      })
    }

    if (this.config.useWs && this.cable) {
      // cable starting will also start
      // an encapsulating http server
      await this.cable.start(port, { withFrontEndClient, frontEndPort })
      this.server = this.cable.http
    } else {
      await new Promise(async accept => {
        this.server = await startPsychicServer({
          app: this.app,
          port,
          withFrontEndClient,
          frontEndPort,
        })
        accept({})
      })
    }

    return true
  }

  public async stop() {
    this.server?.close()
    await stopBackgroundWorkers()
    await closeAllDbConnections()
  }

  public async serveForRequestSpecs(block: () => any) {
    const port = process.env.PORT
    if (!port) throw 'Missing `PORT` environment variable'

    await this.boot()

    let server: Server

    await new Promise(async accept => {
      server = this.app.listen(port, async () => {
        accept({})
      })
    })

    await block()

    server!.close()

    return true
  }

  public buildApp() {
    this.app = express()
    this.app.use(cookieParser())
  }

  private async initializeCors() {
    const getCorsOptions = await importFileWithDefault(absoluteSrcPath('conf/cors'))
    this.app.use(cors(await getCorsOptions()))
  }

  private async initializeJSON() {
    const getJsonOptions = await importFileWithDefault(absoluteSrcPath('conf/json'))
    this.app.use(express.json(await getJsonOptions()))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.app, this.config)
    const routesPath = absoluteSrcPath('conf/routes')
    const routesCB = await importFileWithDefault(routesPath)
    await routesCB(r)
    r.commit()
  }
}
