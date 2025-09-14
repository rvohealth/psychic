import { closeAllDbConnections } from '@rvoh/dream'
import * as cookieParser from 'cookie-parser'
import * as cors from 'cors'
import * as express from 'express'
import { Express } from 'express'
import { Server } from 'node:http'
import logIfDevelopment from '../controller/helpers/logIfDevelopment.js'
import EnvInternal from '../helpers/EnvInternal.js'
import PsychicApp, { PsychicSslCredentials } from '../psychic-app/index.js'
import PsychicRouter from '../router/index.js'
import startPsychicServer, {
  createPsychicHttpInstance,
  StartPsychicServerOptions,
} from './helpers/startPsychicServer.js'

// const debugEnabled = debuglog('psychic').enabled

export default class PsychicServer {
  public static async startPsychicServer(opts: StartPsychicServerOptions): Promise<Server> {
    return await startPsychicServer(opts)
  }

  public static createPsychicHttpInstance(app: Express, sslCredentials: PsychicSslCredentials | undefined) {
    return createPsychicHttpInstance(app, sslCredentials)
  }

  public expressApp: Express
  public httpServer: Server
  private booted = false
  constructor() {
    this.buildApp()
  }

  public async routes() {
    const r = new PsychicRouter(this.expressApp)
    await PsychicApp.getOrFail().routesCb(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

    const psychicApp = PsychicApp.getOrFail()

    this.setSecureDefaultHeaders()

    this.expressApp.use((_, res, next) => {
      Object.keys(psychicApp.defaultResponseHeaders).forEach(key => {
        res.setHeader(key, psychicApp.defaultResponseHeaders[key]!)
      })
      next()
    })

    for (const serverInitBeforeMiddlewareHook of PsychicApp.getOrFail().specialHooks
      .serverInitBeforeMiddleware) {
      await serverInitBeforeMiddlewareHook(this)
    }

    this.initializeCors()
    this.initializeJSON()

    try {
      await PsychicApp.getOrFail().boot()
    } catch (err) {
      const error = err as Error
      PsychicApp.logWithLevel('error', error)
      throw new Error(`
        Failed to boot psychic config. the error thrown was:
          ${error.message}
      `)
    }

    for (const serverInitAfterMiddlewareHook of PsychicApp.getOrFail().specialHooks
      .serverInitAfterMiddleware) {
      await serverInitAfterMiddlewareHook(this)
    }

    await this.buildRoutes()

    for (const afterRoutesHook of PsychicApp.getOrFail().specialHooks.serverInitAfterRoutes) {
      await afterRoutesHook(this)
    }

    this.applyNotFoundMiddleware()

    this.booted = true
    return true
  }

  private applyNotFoundMiddleware() {
    if (!EnvInternal.isDevelopment) return

    this.expressApp.use((req, res, next) => {
      // express by default will set the 200 status code. If a user explicitly
      // provides anything other than 200, we should assume that a prior middleware
      // would have have sent headers, which would prevent any of this from happening.
      // this means that if we are here, we should not be sending a 200. Future middleware
      // by express will automatically pick this up and turn it into a 404, so we are
      // going to automatically set the status to 404 now, so that our logger can
      // pick up the correct status code.
      if (res.statusCode === 200) res.status(404)

      logIfDevelopment({ req, res, startTime: Date.now(), fallbackStatusCode: 404 })

      // call next to let express handle sending the 404
      next()
    })
  }

  private setSecureDefaultHeaders() {
    this.expressApp.disable('x-powered-by')

    this.expressApp.use((_, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff')

      if (EnvInternal.isProduction) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
      next()
    })
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
        sslCredentials: PsychicApp.getOrFail().sslCredentials,
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
    for (const hook of PsychicApp.getOrFail().specialHooks.serverShutdown) {
      await hook(this)
    }

    this.httpServer?.close()

    if (!bypassClosingDbConnections) {
      await closeAllDbConnections()
    }
  }

  public async serveForRequestSpecs(block: () => void | Promise<void>) {
    const port = PsychicApp.getOrFail().port

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
    this.expressApp.use(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cors as unknown as { default: (opts: any) => any }).default(PsychicApp.getOrFail().corsOptions),
    )
  }

  private initializeJSON() {
    this.expressApp.use(express.json(PsychicApp.getOrFail().jsonOptions))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.expressApp)
    await PsychicApp.getOrFail().routesCb(r)
    r.commit()
  }
}
