import { db } from 'dream'
import * as express from 'express'
import { Application } from 'express'
import * as cors from 'cors'
import * as cookieParser from 'cookie-parser'
import PsychicRouter from '../router'
import HowlConfig from '../config'
import log from '../log'
import Cable from '../cable'
import filePath from '../config/helpers/filePath'
import ReactServer from '../server/react'
import HowlRouter from '../router'

export default class HowlServer {
  public app: Application
  public cable: Cable
  public config: HowlConfig
  public reactServer: ReactServer
  private booted = false
  constructor() {
    this.buildApp()
    this.config = new HowlConfig(this.app)
  }

  public get routes() {
    return (this.app._router.stack as any[])
      .filter(r => r.route)
      .flatMap(r => Object.keys(r.route.methods).map(key => `${key.toUpperCase()} ${r.route.path}`))
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

    await import(filePath('.howl/init'))
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
          await log.write(`howl dev server started at port ${port}`)

          if (withReact) await log.write(`react dev server on port ${reactPort}`)
          accept({})
        })
      })
    }

    return true
  }

  public async buildApp() {
    this.app = express()
    this.app.use(cookieParser())
    this.app.use(express.json())

    const getCorsOptions = (await import(filePath('conf/cors'))).default
    this.app.use(cors(await getCorsOptions()))
  }

  private async buildRoutes() {
    const r = new HowlRouter(this.app, this.config)
    const routesPath = this.config.root + '/conf/routes.ts'
    const routes = (await import(routesPath)).default
    routes(r)
  }
}
