import { bodyParser } from '@koa/bodyparser'
import cors from '@koa/cors'
import etag from '@koa/etag'
import { closeAllDbConnections } from '@rvoh/dream/db'
import Koa from 'koa'
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

  /**
   * @internal
   *
   * the maximum number of milliseconds graceful shutdown is allowed
   * to run before the process exits anyway, so that a hung
   * `server:shutdown` hook or db close can never keep a dying
   * process alive
   */
  public static readonly SHUTDOWN_TIMEOUT_MS = 15000

  private async shutdownAndExit() {
    let exitCode = 0

    try {
      await this.stopWithTimeout()
    } catch (error) {
      PsychicApp.logWithLevel('error', '[psychic] error during graceful shutdown:', error)
      exitCode = 1
    }

    process.exit(exitCode)
  }

  /**
   * @internal
   *
   * runs {@link PsychicServer.stop}, rejecting if it has not settled
   * within SHUTDOWN_TIMEOUT_MS
   */
  private async stopWithTimeout() {
    await Promise.race([
      this.stop(),
      new Promise<never>((_, reject) => {
        setTimeout(
          () =>
            reject(
              new Error(
                `[psychic] graceful shutdown timed out after ${PsychicServer.SHUTDOWN_TIMEOUT_MS}ms`,
              ),
            ),
          PsychicServer.SHUTDOWN_TIMEOUT_MS,
        ).unref()
      }),
    ])
  }

  public async stop({
    bypassClosingDbConnections = false,
    gracefulShutdownTimeoutMillis = 10_000,
  }: { bypassClosingDbConnections?: boolean; gracefulShutdownTimeoutMillis?: number } = {}) {
    for (const hook of PsychicApp.getOrFail().specialHooks.serverShutdown) {
      await hook(this)
    }

    if (this.httpServer) {
      const httpServer = this.httpServer
      await new Promise<void>(resolve => {
        // Bounded grace period: if still-active requests haven't finished by
        // the timeout, force the remaining sockets so shutdown can never hang
        // forever (the original bug). `closeIdle/AllConnections` are Node
        // >= 18.2; on older runtimes the optional calls no-op and prior
        // (potentially hanging) behavior is retained rather than throwing.
        const forceTimer = setTimeout(() => httpServer.closeAllConnections?.(), gracefulShutdownTimeoutMillis)
        forceTimer.unref?.()

        // `close` stops accepting new connections and fires its callback only
        // once every existing connection has ended.
        httpServer.close(() => {
          clearTimeout(forceTimer)
          resolve()
        })

        // Immediately drop *idle* keep-alive sockets. These (browsers, fetch
        // agents, reverse proxies sitting between requests) are what kept
        // `close()`'s callback from ever firing — and, transitively, a leased
        // DB pool client from being released — causing shutdown to hang (a
        // SIGTERM drain that never completes; a feature-spec `afterAll` that
        // blocks for the full hook timeout). Dropping only *idle* sockets
        // does NOT abort in-flight requests, so a normal graceful shutdown
        // still lets active handlers finish within the grace period above.
        httpServer.closeIdleConnections?.()
      })
    }

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
    this.koaApp.use(bodyParser(PsychicApp.getOrFail().jsonOptions))
  }

  private async buildRoutes() {
    const r = new PsychicRouter(this.koaApp)
    await PsychicApp.getOrFail().routesCb(r)
    r.commit()
  }
}
