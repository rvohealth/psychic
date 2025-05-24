import { closeAllDbConnections, DreamLogos } from '@rvoh/dream'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as express from 'express'
import { Express, Request, Response } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import { Server } from 'node:http'
import * as path from 'node:path'
import { debuglog, inspect } from 'node:util'
import isOpenapiError, { OpenApiError } from '../helpers/isOpenapiError.js'
import PsychicApp, { PsychicSslCredentials } from '../psychic-app/index.js'
import PsychicRouter from '../router/index.js'
import startPsychicServer, {
  createPsychicHttpInstance,
  StartPsychicServerOptions,
} from './helpers/startPsychicServer.js'

const debugEnabled = debuglog('psychic').enabled

export default class PsychicServer {
  public static async startPsychicServer(opts: StartPsychicServerOptions): Promise<Server> {
    return await startPsychicServer(opts)
  }

  public static createPsychicHttpInstance(app: Express, sslCredentials: PsychicSslCredentials | undefined) {
    return createPsychicHttpInstance(app, sslCredentials)
  }

  public static asciiLogo() {
    return DreamLogos.colorful()
  }

  public expressApp: Express
  public httpServer: Server
  private booted = false
  constructor() {
    this.buildApp()
  }

  public get config() {
    return PsychicApp.getOrFail()
  }

  public async routes() {
    const r = new PsychicRouter(this.expressApp, this.config)
    const psychicApp = PsychicApp.getOrFail()
    await psychicApp.routesCb(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

    const psychicApp = PsychicApp.getOrFail()

    this.expressApp.use((_, res, next) => {
      Object.keys(psychicApp.defaultResponseHeaders).forEach(key => {
        res.setHeader(key, psychicApp.defaultResponseHeaders[key]!)
      })
      next()
    })

    for (const serverInitBeforeMiddlewareHook of this.config.specialHooks.serverInitBeforeMiddleware) {
      await serverInitBeforeMiddlewareHook(this)
    }

    this.initializeCors()
    this.initializeJSON()

    try {
      await this.config.boot()
    } catch (err) {
      const error = err as Error
      PsychicApp.logWithLevel('error', error)
      throw new Error(`
        Failed to boot psychic config. the error thrown was:
          ${error.message}
      `)
    }

    for (const serverInitAfterMiddlewareHook of this.config.specialHooks.serverInitAfterMiddleware) {
      await serverInitAfterMiddlewareHook(this)
    }

    this.initializeOpenapiValidation()

    await this.buildRoutes()

    for (const afterRoutesHook of this.config.specialHooks.serverInitAfterRoutes) {
      await afterRoutesHook(this)
    }

    this.booted = true
    return true
  }

  // TODO: use config helper for fetching default port
  public async start(port?: number) {
    await this.boot()

    const psychicApp = PsychicApp.getOrFail()

    const startOverride = psychicApp['overrides']['server:start']
    if (startOverride) {
      this.httpServer = await startOverride(this, { port })
    } else {
      const httpServer = await startPsychicServer({
        app: this.expressApp,
        port: port || psychicApp.port,
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public attach(id: string, obj: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.$attached[id] = obj
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public $attached: Record<string, any> = {}

  private async shutdownAndExit() {
    await this.stop()
    process.exit()
  }

  public async stop({ bypassClosingDbConnections = false }: { bypassClosingDbConnections?: boolean } = {}) {
    const psychicApp = PsychicApp.getOrFail()
    for (const hook of psychicApp.specialHooks.serverShutdown) {
      await hook(this)
    }

    this.httpServer?.close()

    if (!bypassClosingDbConnections) {
      await closeAllDbConnections()
    }
  }

  public async serveForRequestSpecs(block: () => void | Promise<void>) {
    const psychicApp = PsychicApp.getOrFail()
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
    this.expressApp = express.default()
    this.expressApp.use(cookieParser.default())
  }

  private initializeCors() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.expressApp.use((cors as unknown as { default: (opts: any) => any }).default(this.config.corsOptions))
  }

  private initializeJSON() {
    this.expressApp.use(express.json(this.config.jsonOptions))
  }

  private initializeOpenapiValidation() {
    const psychicApp = PsychicApp.getOrFail()
    for (const openapiName in psychicApp.openapi) {
      const openapiOpts = psychicApp.openapi[openapiName]
      if (openapiOpts?.validation) {
        const opts = openapiOpts.validation
        opts.apiSpec ||= path.join(psychicApp.apiRoot, 'openapi.json')
        this.expressApp.use(OpenApiValidator.middleware(opts as Required<typeof opts>))

        this.expressApp.use((err: OpenApiError, req: Request, res: Response, next: () => void) => {
          if (isOpenapiError(err)) {
            if (debugEnabled) {
              PsychicApp.log(inspect(err))
              console.trace()
            }

            res.status(err.status).json({
              message: err.message,
              errors: err.errors,
            })
          } else {
            if (debugEnabled) {
              PsychicApp.logWithLevel('error', err)
            }
            next()
          }
        })
      }
    }
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.expressApp, this.config)
    const psychicApp = PsychicApp.getOrFail()
    await psychicApp.routesCb(r)
    r.commit()
  }
}
