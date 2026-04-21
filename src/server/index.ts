import cors from '@koa/cors'
import etag from '@koa/etag'
import { closeAllDbConnections } from '@rvoh/dream/db'
import Koa from 'koa'
import koaBodyparser from 'koa-bodyparser'
import conditional from 'koa-conditional-get'
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

  public static createPsychicHttpInstance(app: Koa, sslCredentials: PsychicSslCredentials | undefined) {
    return createPsychicHttpInstance(app, sslCredentials)
  }

  public koaApp: Koa
  public httpServer: Server
  private booted = false
  constructor() {
    this.buildApp()
  }

  public async routes() {
    const r = new PsychicRouter(this.koaApp)
    await PsychicApp.getOrFail().routesCb(r)
    return r.routes
  }

  public async boot() {
    if (this.booted) return

    const psychicApp = PsychicApp.getOrFail()

    this.setSecureDefaultHeaders()

    this.koaApp.use(async (ctx, next) => {
      Object.keys(psychicApp.defaultResponseHeaders).forEach(key => {
        ctx.set(key, psychicApp.defaultResponseHeaders[key]!)
      })
      await next()
    })

    for (const serverInitBeforeMiddlewareHook of PsychicApp.getOrFail().specialHooks
      .serverInitBeforeMiddleware) {
      await serverInitBeforeMiddlewareHook(this)
    }

    // ETag support (Express has this built-in, Koa needs middleware)
    this.koaApp.use(conditional())
    this.koaApp.use(etag())

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

    this.koaApp.use(async (ctx, next) => {
      await next()

      // Koa defaults to 404 for unmatched routes. If nothing set the body,
      // log the 404 in development.
      if (ctx.status === 404 && !ctx.body) {
        logIfDevelopment({ ctx, startTime: Date.now(), fallbackStatusCode: 404 })
      }
    })
  }

  private setSecureDefaultHeaders() {
    // Koa doesn't send x-powered-by by default, no need to disable it.

    this.koaApp.use(async (ctx, next) => {
      // Prevent MIME-sniffing; browsers must honor the declared Content-Type
      // even if an endpoint accidentally serves something looking like HTML.
      ctx.set('X-Content-Type-Options', 'nosniff')
      // Block cross-origin pages from embedding this response as a resource
      // (<script src>, <img>, <link>, etc.), which raises the bar for
      // speculative cross-origin reads (Spectre / XS-Leaks class). Applies
      // to API responses regardless of Content-Type.
      ctx.set('Cross-Origin-Resource-Policy', 'same-origin')

      if (EnvInternal.isProduction) {
        ctx.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      }
      await next()
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
        app: this.koaApp,
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
      server = this.koaApp.listen(port, () => accept({}))
    })

    await block()

    server!.close()

    return true
  }

  public buildApp() {
    this.koaApp = new Koa()
  }

  private initializeCors() {
    const corsOptions = PsychicApp.getOrFail().corsOptions
    // When the app hasn't called psy.set('cors', ...), don't mount @koa/cors
    // at all. @koa/cors with undefined options defaults `origin` to '*' and
    // would emit Access-Control-Allow-Origin: * on every response — a
    // foot-gun for an API serving user-scoped data. Not mounting leaves the
    // response with no CORS headers, which the browser treats as same-origin
    // only. Apps opt in to cross-origin by configuring cors explicitly.
    if (corsOptions === undefined) return
    this.koaApp.use(cors(corsOptions))
  }

  private initializeJSON() {
    this.koaApp.use(koaBodyparser(PsychicApp.getOrFail().jsonOptions))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.koaApp)
    await PsychicApp.getOrFail().routesCb(r)
    r.commit()
  }
}
