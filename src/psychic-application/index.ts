import {
  DreamApplication,
  DreamApplicationInitOptions,
  DreamLogLevel,
  DreamLogger,
  Encrypt,
  EncryptAlgorithm,
  EncryptOptions,
  OpenapiSchemaBody,
} from '@rvohealth/dream'
import * as bodyParser from 'body-parser'
import { CorsOptions } from 'cors'
import { Request, Response } from 'express'
import * as OpenApiValidator from 'express-openapi-validator'
import * as http from 'http'
import PsychicController from '../controller'
import PsychicApplicationInitMissingApiRoot from '../error/psychic-application/init-missing-api-root'
import PsychicApplicationInitMissingCallToLoadControllers from '../error/psychic-application/init-missing-call-to-load-controllers'
import PsychicApplicationInitMissingRoutesCallback from '../error/psychic-application/init-missing-routes-callback'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts'
import EnvInternal from '../helpers/EnvInternal'
import {
  OpenapiContent,
  OpenapiHeaders,
  OpenapiResponses,
  OpenapiSecurity,
  OpenapiSecuritySchemes,
  OpenapiServer,
} from '../openapi-renderer/endpoint'
import PsychicRouter from '../router'
import PsychicServer from '../server'
import { cachePsychicApplication, getCachedPsychicApplicationOrFail } from './cache'
import lookupClassByGlobalName from './helpers/lookupClassByGlobalName'
import processControllers, { getControllersOrFail } from './helpers/processControllers'
import { PsychicHookEventType, PsychicHookLoadEventTypes } from './types'

export default class PsychicApplication {
  public static async init(
    cb: (app: PsychicApplication) => void | Promise<void>,
    dreamCb: (app: DreamApplication) => void | Promise<void>,
    opts: PsychicApplicationInitOptions = {},
  ) {
    let psychicApp: PsychicApplication

    await DreamApplication.init(
      dreamCb,
      { bypassModelIntegrityCheck: opts.bypassModelIntegrityCheck },
      async dreamApp => {
        psychicApp = new PsychicApplication()
        await cb(psychicApp)

        if (!psychicApp.loadedControllers) throw new PsychicApplicationInitMissingCallToLoadControllers()
        if (!psychicApp.apiRoot) throw new PsychicApplicationInitMissingApiRoot()
        if (!psychicApp.routesCb) throw new PsychicApplicationInitMissingRoutesCallback()

        if (psychicApp.encryption?.cookies?.current)
          this.checkKey(
            'cookies',
            psychicApp.encryption.cookies.current.key,
            psychicApp.encryption.cookies.current.algorithm,
          )

        await psychicApp.inflections?.()

        dreamApp.set('projectRoot', psychicApp.apiRoot)
        dreamApp.set('logger', psychicApp.logger)

        cachePsychicApplication(psychicApp)
      },
    )

    return psychicApp!
  }

  public static lookupClassByGlobalName(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return lookupClassByGlobalName(name)
  }

  private static checkKey(encryptionIdentifier: 'cookies', key: string, algorithm: EncryptAlgorithm) {
    if (!Encrypt.validateKey(key, algorithm))
      console.warn(
        `
Your current key value for ${encryptionIdentifier} encryption is invalid.
Try setting it to something valid, like:
  ${Encrypt.generateKey(algorithm)}

(This was done by calling:
  Encrypt.generateKey('${algorithm}')
`,
      )
  }

  /**
   * Returns the cached psychic application if it has been set.
   * If it has not been set, an exception is raised.
   *
   * The psychic application can be set by calling PsychicApplication#init
   */
  public static getOrFail() {
    return getCachedPsychicApplicationOrFail()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static log(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.getOrFail().logger.info(...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static logWithLevel(level: DreamLogLevel, ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.getOrFail().logger[level](...args)
  }

  private _apiOnly: boolean = false
  public get apiOnly() {
    return this._apiOnly
  }

  private _apiRoot: string
  public get apiRoot() {
    return this._apiRoot
  }

  private _sessionCookieName: string = 'session'
  public get sessionCookieName() {
    return this._sessionCookieName
  }

  private _clientRoot: string
  public get clientRoot() {
    return this._clientRoot
  }

  private _encryption: PsychicApplicationEncryptionOptions | undefined
  public get encryption() {
    return this._encryption
  }

  private _appName: string = 'untitled app'
  public get appName() {
    return this._appName
  }

  private _port: number = EnvInternal.integer('PORT', { optional: true }) || 7777
  public get port() {
    return this._port
  }

  private _corsOptions: CorsOptions = {}
  public get corsOptions() {
    return this._corsOptions
  }

  private _jsonOptions: bodyParser.Options
  public get jsonOptions() {
    return this._jsonOptions
  }

  private _cookieOptions: { maxAge: number }
  public get cookieOptions() {
    return this._cookieOptions
  }

  private _logger: PsychicLogger = console
  public get logger() {
    return this._logger
  }

  private _sslCredentials?: PsychicSslCredentials
  public get sslCredentials() {
    return this._sslCredentials
  }

  private _saltRounds?: number
  public get saltRounds() {
    return this._saltRounds
  }

  private _routesCb: (r: PsychicRouter) => void | Promise<void>
  public get routesCb() {
    return this._routesCb
  }

  private _openapi: Record<string, NamedPsychicOpenapiOptions> = {
    default: {
      outputFilename: 'openapi.json',
      schemaDelimeter: '',
    },
  }
  public get openapi() {
    return this._openapi
  }

  private _client: Required<PsychicClientOptions> = {
    apiPath: 'src/api',
  }
  public get client() {
    return this._client
  }

  private _paths: Required<PsychicPathOptions> = {
    apiRoutes: 'src/conf/routes.ts',
    controllers: 'src/app/controllers',
    controllerSpecs: 'spec/unit/controllers',
  }
  public get paths() {
    return this._paths
  }

  private _inflections?: () => void | Promise<void>
  public get inflections() {
    return this._inflections
  }

  private _bootHooks: Record<
    PsychicHookLoadEventTypes,
    ((conf: PsychicApplication) => void | Promise<void>)[]
  > = {
    boot: [],
    load: [],
    'load:dev': [],
    'load:test': [],
    'load:prod': [],
  }
  public get bootHooks() {
    return this._bootHooks
  }

  private _specialHooks: PsychicApplicationSpecialHooks = {
    sync: [],
    serverInit: [],
    serverInitAfterRoutes: [],
    serverStart: [],
    serverError: [],
    serverShutdown: [],
  }
  public get specialHooks() {
    return this._specialHooks
  }

  private _overrides: PsychicApplicationOverrides = {
    ['server:start']: null,
  }
  private get overrides() {
    return this._overrides
  }

  private _loadedControllers: boolean = false
  public get loadedControllers() {
    return this._loadedControllers
  }

  private _baseDefaultResponseHeaders: Record<string, string | null> = {
    ['cache-control']: 'max-age=0, private, must-revalidate',
  }
  private _defaultResponseHeaders: Record<string, string | null> = {}
  public get defaultResponseHeaders() {
    return {
      ...this._baseDefaultResponseHeaders,
      ...this._defaultResponseHeaders,
    }
  }

  public get controllers() {
    return getControllersOrFail()
  }

  public load<RT extends 'controllers'>(
    resourceType: RT,
    resourcePath: string,
    resources: RT extends 'controllers' ? [string, typeof PsychicController][] : never,
  ) {
    switch (resourceType) {
      case 'controllers':
        processControllers(this, resourcePath, resources)
        this._loadedControllers = true
        break
    }
  }

  private booted = false
  public async boot(force: boolean = false) {
    if (this.booted && !force) return

    // await new IntegrityChecker().check()

    await this.runHooksFor('load')

    switch (EnvInternal.nodeEnv) {
      case 'development':
        await this.runHooksFor('load:dev')
        break

      case 'production':
        await this.runHooksFor('load:prod')
        break

      case 'test':
        await this.runHooksFor('load:test')
        break
    }

    await this.inflections?.()

    this.booted = true
  }

  public on<T extends PsychicHookEventType>(
    hookEventType: T,
    cb: T extends 'server:error'
      ? (err: Error, req: Request, res: Response) => void | Promise<void>
      : T extends 'server:init'
        ? (psychicServer: PsychicServer) => void | Promise<void>
        : T extends 'server:start'
          ? (psychicServer: PsychicServer) => void | Promise<void>
          : T extends 'server:shutdown'
            ? (psychicServer: PsychicServer) => void | Promise<void>
            : T extends 'server:init:after-routes'
              ? (psychicServer: PsychicServer) => void | Promise<void>
              : T extends 'sync'
                ? // NOTE: this is really any | Promise<any>, but eslint complains about this foolery
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  () => any
                : (conf: PsychicApplication) => void | Promise<void>,
  ) {
    switch (hookEventType) {
      case 'server:error':
        this._specialHooks.serverError.push(
          cb as (err: Error, req: Request, res: Response) => void | Promise<void>,
        )
        break

      case 'server:init':
        this._specialHooks.serverInit.push(cb as (psychicServer: PsychicServer) => void | Promise<void>)
        break

      case 'server:start':
        this._specialHooks.serverStart.push(cb as (psychicServer: PsychicServer) => void | Promise<void>)
        break

      case 'server:shutdown':
        this._specialHooks.serverShutdown.push(cb as (psychicServer: PsychicServer) => void | Promise<void>)
        break

      case 'server:init:after-routes':
        this._specialHooks.serverInitAfterRoutes.push(cb as (server: PsychicServer) => void | Promise<void>)
        break

      case 'sync':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._specialHooks['sync'].push(cb as () => any)
        break

      default:
        this.bootHooks[hookEventType as PsychicHookLoadEventTypes].push(
          cb as (conf: PsychicApplication) => void | Promise<void>,
        )
    }
  }

  public set(option: 'openapi', name: string, value: NamedPsychicOpenapiOptions): void
  public set<Opt extends PsychicApplicationOption>(
    option: Opt,
    value: Opt extends 'appName'
      ? string
      : Opt extends 'apiOnly'
        ? boolean
        : Opt extends 'defaultResponseHeaders'
          ? Record<string, string | null>
          : Opt extends 'encryption'
            ? PsychicApplicationEncryptionOptions
            : Opt extends 'cors'
              ? CorsOptions
              : Opt extends 'cookie'
                ? CustomCookieOptions
                : Opt extends 'apiRoot'
                  ? string
                  : Opt extends 'sessionCookieName'
                    ? string
                    : Opt extends 'clientRoot'
                      ? string
                      : Opt extends 'json'
                        ? bodyParser.Options
                        : Opt extends 'logger'
                          ? PsychicLogger
                          : Opt extends 'client'
                            ? PsychicClientOptions
                            : Opt extends 'ssl'
                              ? PsychicSslCredentials
                              : Opt extends 'openapi'
                                ? DefaultPsychicOpenapiOptions
                                : Opt extends 'paths'
                                  ? PsychicPathOptions
                                  : Opt extends 'port'
                                    ? number
                                    : Opt extends 'saltRounds'
                                      ? number
                                      : Opt extends 'inflections'
                                        ? () => void | Promise<void>
                                        : Opt extends 'routes'
                                          ? (r: PsychicRouter) => void | Promise<void>
                                          : never,
  ): void
  public set<Opt extends PsychicApplicationOption>(option: Opt, unknown1: unknown, unknown2?: unknown) {
    const value = unknown2 || unknown1

    switch (option) {
      case 'appName':
        this._appName = value as string
        break

      case 'apiOnly':
        this._apiOnly = value as boolean
        break

      case 'apiRoot':
        this._apiRoot = value as string
        break

      case 'clientRoot':
        this._clientRoot = value as string
        break

      case 'defaultResponseHeaders':
        this._defaultResponseHeaders = Object.keys(value as Record<string, string>).reduce(
          (agg, key) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            agg[key.toLowerCase()] = (value as any)[key as keyof typeof value] as string
            return agg
          },
          {} as Record<string, string>,
        ) as Record<string, string | null>
        break

      case 'sessionCookieName':
        this._sessionCookieName = value as string
        break

      case 'encryption':
        this._encryption = value as PsychicApplicationEncryptionOptions
        break

      case 'cors':
        this._corsOptions = { ...this.corsOptions, ...(value as CorsOptions) }
        break

      case 'cookie':
        this._cookieOptions = {
          ...this.cookieOptions,
          maxAge: cookieMaxAgeFromCookieOpts((value as CustomCookieOptions).maxAge),
        }
        break

      case 'client':
        this._client = { ...this.client, ...(value as PsychicClientOptions) }
        break

      case 'routes':
        this._routesCb = value as (r: PsychicRouter) => void | Promise<void>
        break

      case 'json':
        this._jsonOptions = { ...this.jsonOptions, ...(value as bodyParser.Options) }
        break

      case 'logger':
        this._logger = value as PsychicLogger
        break

      case 'ssl':
        this._sslCredentials = { ...this.sslCredentials, ...(value as PsychicSslCredentials) }
        break

      case 'port':
        this._port = value as number
        break

      case 'saltRounds':
        this._saltRounds = value as number
        break

      case 'openapi':
        this._openapi = {
          ...this.openapi,
          [unknown2 ? (unknown1 as string) : 'default']: {
            outputFilename: 'openapi.json',
            ...(value as DefaultPsychicOpenapiOptions | NamedPsychicOpenapiOptions),
          },
        }
        break

      case 'paths':
        this._paths = {
          ...this.paths,
          ...(value as PsychicPathOptions),
        }
        break

      case 'inflections':
        this._inflections = value as () => void | Promise<void>
        break

      default:
        throw new Error(`Unhandled option type passed to PsychicApplication#set: ${option}`)
    }
  }

  public override<Override extends keyof PsychicApplicationOverrides>(
    override: Override,
    value: PsychicApplicationOverrides[Override],
  ) {
    switch (override) {
      case 'server:start':
        this.overrides['server:start'] = value
    }
  }

  private async runHooksFor(hookEventType: PsychicHookLoadEventTypes) {
    for (const hook of this.bootHooks[hookEventType]) {
      await hook(this)
    }
  }
}

export type PsychicApplicationOption =
  | 'appName'
  | 'apiOnly'
  | 'apiRoot'
  | 'encryption'
  | 'sessionCookieName'
  | 'client'
  | 'clientRoot'
  | 'cookie'
  | 'cors'
  | 'defaultResponseHeaders'
  | 'inflections'
  | 'json'
  | 'logger'
  | 'openapi'
  | 'paths'
  | 'port'
  | 'routes'
  | 'saltRounds'
  | 'ssl'

export interface PsychicApplicationSpecialHooks {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sync: (() => any)[]
  serverInit: ((server: PsychicServer) => void | Promise<void>)[]
  serverInitAfterRoutes: ((server: PsychicServer) => void | Promise<void>)[]
  serverStart: ((server: PsychicServer) => void | Promise<void>)[]
  serverShutdown: ((server: PsychicServer) => void | Promise<void>)[]
  serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[]
}

export interface PsychicApplicationOverrides {
  // a function which overrides the server's default start mechanisms.
  // by doing so, it must both instantiate its own http.Server instance,
  // start that instance, and then return the http server, after the instance
  // has started.
  ['server:start']:
    | ((
        psychicServer: PsychicServer,
        opts: PsychicServerStartProviderOptions,
      ) => http.Server | Promise<http.Server>)
    | null
}

export interface PsychicServerStartProviderOptions {
  port: number | undefined
  withFrontEndClient: boolean
  frontEndPort: number | undefined
}

export interface CustomCookieOptions {
  maxAge?: CustomCookieMaxAgeOptions
}

export interface CustomCookieMaxAgeOptions {
  milliseconds?: number
  seconds?: number
  minutes?: number
  hours?: number
  days?: number
}

export interface PsychicSslCredentials {
  key: string | undefined
  cert: string | undefined
}

export interface DefaultPsychicOpenapiOptions extends PsychicOpenapiBaseOptions {
  outputFilename?: `${string}.json`
}

export interface NamedPsychicOpenapiOptions extends PsychicOpenapiBaseOptions {
  outputFilename: `${string}.json`
}

interface PsychicOpenapiBaseOptions {
  servers?: OpenapiServer[]
  schemaDelimeter?: string
  suppressResponseEnums?: boolean
  syncEnumsToClient?: boolean
  validation?: Partial<Parameters<(typeof OpenApiValidator)['middleware']>[0]>
  defaults?: {
    headers?: OpenapiHeaders
    responses?: OpenapiResponses
    securitySchemes?: OpenapiSecuritySchemes
    security?: OpenapiSecurity
    components?: {
      [key: string]: {
        [key: string]: OpenapiSchemaBody | OpenapiContent
      }
    }
  }
}

interface PsychicPathOptions {
  apiRoutes?: string
  controllers?: string
  controllerSpecs?: string
}

export interface PsychicClientOptions {
  apiPath?: string
}

export type PsychicLogger = DreamLogger
export type PsychicLogLevel = DreamLogLevel

export type PsychicApplicationInitOptions = DreamApplicationInitOptions

export interface PsychicApplicationEncryptionOptions {
  cookies: SegmentedEncryptionOptions
}
interface SegmentedEncryptionOptions {
  current: EncryptOptions
  legacy?: EncryptOptions
}
