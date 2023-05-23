import { db } from 'dream'
import express from 'express'
import { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import PsychicConfig from '../config'
import log from '../log'
import Cable from '../cable'
import ReactServer from '../server/react'
import PsychicRouter from '../router'
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import { Server } from 'http'

export default class PsychicServer {
  public app: Application
  public cable: Cable
  public config: PsychicConfig
  public reactServer: ReactServer
  private booted = false
  constructor() {
    this.buildApp()
    this.config = new PsychicConfig(this.app)
  }

  public async routes() {
    const r = new PsychicRouter(this.app, this.config)
    const routesPath = absoluteSrcPath('conf/routes.ts')
    const routesCB = await importFileWithDefault(routesPath)
    routesCB(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return
    this.booted = true

    try {
      await this.config.boot()
    } catch (err) {
      throw `
        Failed to boot psychic config. the error thrown was:
          ${err}
      `
    }

    await this.buildRoutes()

    if (this.config.useWs) this.cable = new Cable(this.app)

    return true
  }

  // TODO: use config helper for fetching default port
  public async start(
    port = process.env.PORT || 7777,
    {
      withReact = process.env.REACT === '1',
      reactPort = 3000,
    }: {
      withReact?: boolean
      reactPort?: number
    } = {}
  ) {
    await this.boot()

    if (withReact) {
      this.reactServer = new ReactServer()
      this.reactServer.start(reactPort)

      process.on('SIGTERM', async () => {
        await this.reactServer?.stop()
      })
    }

    if (this.config.useWs && this.cable) {
      // cable starting will also start
      // an encapsulating http server
      await this.cable.start(port, { withReact, reactPort })
    } else {
      await new Promise(async accept => {
        this.app.listen(port, async () => {
          log.welcome(port)
          await log.write(`psychic dev server started at port ${port}`)

          if (withReact) await log.write(`react dev server on port ${reactPort}`)
          accept({})
        })
      })
    }

    return true
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

  public async buildApp() {
    this.app = express()
    this.app.use(cookieParser())
    this.app.use(express.json())

    const getCorsOptions = await importFileWithDefault(absoluteSrcPath('conf/cors'))
    this.app.use(cors(await getCorsOptions()))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.app, this.config)
    const routesPath = absoluteSrcPath('conf/routes.ts')
    const routesCB = await importFileWithDefault(routesPath)
    routesCB(r)
    r.commit()
  }
}
