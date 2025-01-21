import { closeAllDbConnections } from '@rvohealth/dream'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express, { Application, Request, Response } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { Server } from 'http'
import path from 'path'
import background from '../background'
import Cable from '../cable'
import EnvInternal from '../helpers/EnvInternal'
import isOpenapiError, { OpenApiError } from '../helpers/isOpenapiError'
import PsychicApplication from '../psychic-application'
import PsychicRouter from '../router'
import FrontEndClientServer from './front-end-client'
import startPsychicServer from './helpers/startPsychicServer'

export default class PsychicServer {
  public expressApp: Application
  public frontEndClient: FrontEndClientServer
  public httpServer: Server
  private cable: Cable
  private booted = false
  constructor() {
    this.buildApp()
  }

  public get config() {
    return PsychicApplication.getOrFail()
  }

  public async routes() {
    const r = new PsychicRouter(this.expressApp, this.config)
    const psychicApp = PsychicApplication.getOrFail()
    await psychicApp.routesCb(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

    const psychicApp = PsychicApplication.getOrFail()

    this.expressApp.use((_, res, next) => {
      Object.keys(psychicApp.defaultResponseHeaders).forEach(key => {
        res.setHeader(key, psychicApp.defaultResponseHeaders[key]!)
      })
      next()
    })

    await this.config['runHooksFor']('boot')

    this.initializeCors()
    this.initializeJSON()

    try {
      await this.config.boot()
    } catch (err) {
      const error = err as Error
      PsychicApplication.logWithLevel('error', error)
      throw new Error(`
        Failed to boot psychic config. the error thrown was:
          ${error.message}
      `)
    }

    for (const expressInitHook of this.config.specialHooks.expressInit) {
      await expressInitHook(this)
    }

    this.initializeOpenapiValidation()

    await this.buildRoutes()

    for (const afterRoutesHook of this.config.specialHooks['after:routes']) {
      await afterRoutesHook(this.expressApp)
    }

    if (this.config.useWs) this.cable = new Cable(this.expressApp, this.config)

    this.booted = true
    return true
  }

  // TODO: use config helper for fetching default port
  public async start(
    port?: number,
    {
      withFrontEndClient = EnvInternal.boolean('CLIENT'),
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
    }

    const psychicApp = PsychicApplication.getOrFail()

    if (this.config.useWs && this.cable) {
      // cable starting will also start
      // an encapsulating http server
      await this.cable.start(port, { withFrontEndClient, frontEndPort })
      this.httpServer = this.cable.httpServer
    } else {
      const httpServer = await startPsychicServer({
        app: this.expressApp,
        port: port || psychicApp.port,
        withFrontEndClient,
        frontEndPort,
        sslCredentials: this.config.sslCredentials,
      })
      this.httpServer = httpServer
    }

    for (const hook of psychicApp.specialHooks.serverStart) {
      await hook(this)
    }

    process.on('SIGINT', () => {
      void this.shutdownAndExit()
    })

    process.on('SIGTERM', () => {
      void this.shutdownAndExit()
    })

    return true
  }

  private async shutdownAndExit() {
    await this.stop()
    process.exit()
  }

  public async stop({ bypassClosingDbConnections = false }: { bypassClosingDbConnections?: boolean } = {}) {
    const psychicApp = PsychicApplication.getOrFail()
    for (const hook of psychicApp.specialHooks.serverShutdown) {
      await hook(this)
    }

    this.frontEndClient?.stop()
    this.httpServer?.close()

    this.cable?.stop()
    await background.closeAllRedisConnections()

    if (!bypassClosingDbConnections) {
      await closeAllDbConnections()
    }
  }

  public async serveForRequestSpecs(block: () => void | Promise<void>) {
    const psychicApp = PsychicApplication.getOrFail()
    const port = psychicApp.port

    await this.boot()

    let server: Server

    await new Promise(accept => {
      server = this.expressApp.listen(port, () => accept({}))
    })

    await block()

    server!.close()

    return true
  }

  public buildApp() {
    this.expressApp = express()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.expressApp.use(cookieParser() as any)
  }

  private initializeCors() {
    this.expressApp.use(cors(this.config.corsOptions))
  }

  private initializeJSON() {
    this.expressApp.use(express.json(this.config.jsonOptions))
  }

  private initializeOpenapiValidation() {
    const psychicApp = PsychicApplication.getOrFail()
    for (const openapiName in psychicApp.openapi) {
      const openapiOpts = psychicApp.openapi[openapiName]
      if (openapiOpts?.validation) {
        const opts = openapiOpts.validation
        opts.apiSpec ||= path.join(psychicApp.apiRoot, 'openapi.json')
        this.expressApp.use(OpenApiValidator.middleware(opts as Required<typeof opts>))

        this.expressApp.use((err: OpenApiError, req: Request, res: Response, next: () => void) => {
          if (isOpenapiError(err)) {
            if (EnvInternal.isDebug) {
              PsychicApplication.log(JSON.stringify(err))
              console.trace()
            }

            res.status(err.status).json({
              message: err.message,
              errors: err.errors,
            })
          } else {
            if (EnvInternal.isDebug) {
              PsychicApplication.logWithLevel('error', err)
            }
            next()
          }
        })
      }
    }
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.expressApp, this.config)
    const psychicApp = PsychicApplication.getOrFail()
    await psychicApp.routesCb(r)
    r.commit()
  }
}
