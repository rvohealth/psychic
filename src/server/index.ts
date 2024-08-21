import { closeAllDbConnections } from '@rvohealth/dream'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application } from 'express'
import { Server } from 'http'
import { stopBackgroundWorkers } from '../background'
import Cable from '../cable'
import { envBool } from '../helpers/envValue'
import PsychicApplication from '../psychic-application'
import PsychicRouter from '../router'
import FrontEndClientServer from './front-end-client'
import startPsychicServer from './helpers/startPsychicServer'

export default class PsychicServer {
  public app: Application
  public cable: Cable
  public frontEndClient: FrontEndClientServer
  public server: Server
  private booted = false
  constructor() {
    this.buildApp()
  }

  public get config() {
    return PsychicApplication.getOrFail()
  }

  public async routes() {
    const r = new PsychicRouter(this.app, this.config)
    const psychicApp = PsychicApplication.getOrFail()
    await psychicApp.routesCb(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

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

    for (const expressInitHook of this.config.specialHooks.expressInit) {
      await expressInitHook(this.app)
    }

    await this.buildRoutes()

    for (const afterRoutesHook of this.config.specialHooks['after:routes']) {
      await afterRoutesHook(this.app)
    }

    if (this.config.useWs) this.cable = new Cable(this.app, this.config)

    this.booted = true
    return true
  }

  // TODO: use config helper for fetching default port
  public async start(
    port?: number,
    {
      withFrontEndClient = envBool('CLIENT'),
      frontEndPort = 3000,
    }: {
      withFrontEndClient?: boolean
      frontEndPort?: number
    } = {},
  ) {
    await this.boot()

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
        const psychicApp = PsychicApplication.getOrFail()

        startPsychicServer({
          app: this.app,
          port: port || psychicApp.port,
          withFrontEndClient,
          frontEndPort,
          sslCredentials: this.config.sslCredentials,
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
    const psychicApp = PsychicApplication.getOrFail()
    const port = psychicApp.port
    if (!port)
      throw new Error(
        `
Missing port in your psychic app configuration.

Please provide a value for "port" within your conf/app.ts file, like so:


  // conf/app.ts
  export default async (app: PsychicApplication) => {
    app.set('port', parseInt(process.env.PORT!))
  }
`,
      )

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.app.use(cookieParser() as any)
  }

  private initializeCors() {
    this.app.use(cors(this.config.corsOptions))
  }

  private initializeJSON() {
    this.app.use(express.json(this.config.jsonOptions))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.app, this.config)
    const psychicApp = PsychicApplication.getOrFail()
    await psychicApp.routesCb(r)
    r.commit()
  }
}
