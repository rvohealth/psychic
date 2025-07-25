import {
  DreamApp,
  DreamAppAllowedPackageManagersEnum,
  DreamAppAllowedPackageManagersEnumValues,
  DreamAppInitOptions,
  DreamLogLevel,
  DreamLogger,
  Encrypt,
  EncryptAlgorithm,
  EncryptOptions,
  OpenapiSchemaBody,
} from '@rvoh/dream'
import * as bodyParser from 'body-parser'
import { Command } from 'commander'
import { CorsOptions } from 'cors'
import { Request, RequestHandler, Response } from 'express'
import * as http from 'node:http'
import PackageManager from '../cli/helpers/PackageManager.js'
import PsychicAppInitMissingApiRoot from '../error/psychic-app/init-missing-api-root.js'
import PsychicAppInitMissingCallToLoadControllers from '../error/psychic-app/init-missing-call-to-load-controllers.js'
import PsychicAppInitMissingPackageManager from '../error/psychic-app/init-missing-package-manager.js'
import PsychicAppInitMissingRoutesCallback from '../error/psychic-app/init-missing-routes-callback.js'
import cookieMaxAgeFromCookieOpts from '../helpers/cookieMaxAgeFromCookieOpts.js'
import EnvInternal from '../helpers/EnvInternal.js'
import pascalizeFileName from '../helpers/pascalizeFileName.js'
import {
  OpenapiContent,
  OpenapiHeaders,
  OpenapiResponses,
  OpenapiSecurity,
  OpenapiSecuritySchemes,
  OpenapiServer,
} from '../openapi-renderer/endpoint.js'
import PsychicRouter from '../router/index.js'
import PsychicServer from '../server/index.js'
import { cachePsychicApp, getCachedPsychicAppOrFail } from './cache.js'
import importControllers, { getControllersOrFail } from './helpers/import/importControllers.js'
import importInitializers, { getInitializersOrBlank } from './helpers/import/importInitializers.js'
import importServices, { getServicesOrFail } from './helpers/import/importServices.js'
import lookupClassByGlobalName from './helpers/lookupClassByGlobalName.js'
import { PsychicHookEventType, PsychicUseEventType } from './types.js'

export default class PsychicApp {
  public static async init(
    cb: (app: PsychicApp) => void | Promise<void>,
    dreamCb: (app: DreamApp) => void | Promise<void>,
    opts: PsychicAppInitOptions = {},
  ) {
    let psychicApp: PsychicApp

    await DreamApp.init(
      dreamCb,
      { bypassModelIntegrityCheck: opts.bypassModelIntegrityCheck! },
      async dreamApp => {
        psychicApp = new PsychicApp()
        await cb(psychicApp)

        if (!psychicApp.loadedControllers) throw new PsychicAppInitMissingCallToLoadControllers()
        if (!psychicApp.apiRoot) throw new PsychicAppInitMissingApiRoot()
        if (!psychicApp.routesCb) throw new PsychicAppInitMissingRoutesCallback()
        if (!DreamAppAllowedPackageManagersEnumValues.includes(psychicApp.packageManager))
          throw new PsychicAppInitMissingPackageManager()

        if (psychicApp.encryption?.cookies?.current)
          this.checkKey(
            'cookies',
            psychicApp.encryption.cookies.current.key,
            psychicApp.encryption.cookies.current.algorithm,
          )

        await psychicApp.inflections?.()

        dreamApp.on('repl:start', context => {
          const psychicApp = PsychicApp.getOrFail()

          for (const globalName of Object.keys(psychicApp.services)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            if (!(context as any)[globalName]) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
              ;(context as any)[pascalizeFileName(globalName)] = psychicApp.services[globalName]
            }
          }
        })

        for (const initializerCb of Object.values(PsychicApp.getInitializersOrBlank())) {
          await initializerCb(psychicApp)
        }

        for (const plugin of psychicApp.plugins) {
          await plugin(psychicApp)
        }

        dreamApp.set('projectRoot', psychicApp.apiRoot)
        dreamApp.set('logger', psychicApp.logger)
        dreamApp.set('packageManager', psychicApp.packageManager)

        cachePsychicApp(psychicApp)
      },
    )

    return psychicApp!
  }

  public static lookupClassByGlobalName(name: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return lookupClassByGlobalName(name)
  }

  /**
   * @internal
   *
   * adds the necessary package manager prefix to the psy command provided
   * i.e. `psyCmd('sync')`
   */
  public psyCmd(cmd: string) {
    return PackageManager.run(`psy ${cmd}`)
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
   * The psychic application can be set by calling PsychicApp#init
   */
  public static getOrFail() {
    return getCachedPsychicAppOrFail()
  }

  public static getInitializersOrBlank() {
    return getInitializersOrBlank()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static log(...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    DreamApp.log(...args)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static logWithLevel(level: DreamLogLevel, ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    DreamApp.logWithLevel(level, ...args)
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

  private _encryption: PsychicAppEncryptionOptions | undefined
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

  private _sslCredentials: PsychicSslCredentials | undefined = undefined
  public get sslCredentials() {
    return this._sslCredentials
  }

  private _saltRounds: number | undefined = undefined
  public get saltRounds() {
    return this._saltRounds
  }

  private _packageManager: DreamAppAllowedPackageManagersEnum
  public get packageManager() {
    return this._packageManager
  }

  private _importExtension: GeneratorImportStyle = '.js'
  public get importExtension() {
    return this._importExtension
  }

  private _routesCb: (r: PsychicRouter) => void | Promise<void>
  public get routesCb() {
    return this._routesCb
  }

  private _openapi: Record<string, NamedPsychicOpenapiOptions> = {
    default: {
      outputFilepath: 'openapi.json',
      info: {
        title: 'untitled openapi spec',
        version: 'unknown version',
        description: '',
      },
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
    services: 'src/app/services',
    controllerSpecs: 'spec/unit/controllers',
  }
  public get paths() {
    return this._paths
  }

  private _inflections?: () => void | Promise<void>
  public get inflections() {
    return this._inflections
  }

  private _specialHooks: PsychicAppSpecialHooks = {
    cliSync: [],
    serverInitBeforeMiddleware: [],
    serverInitAfterMiddleware: [],
    serverInitAfterRoutes: [],
    serverStart: [],
    serverError: [],
    serverShutdown: [],
  }
  public get specialHooks() {
    return this._specialHooks
  }

  private _overrides: PsychicAppOverrides = {
    ['server:start']: null,
  }
  private get overrides() {
    return this._overrides
  }

  private _loadedControllers: boolean = false
  public get loadedControllers() {
    return this._loadedControllers
  }

  private _loadedServices: boolean = false
  public get loadedServices() {
    return this._loadedServices
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

  public get services() {
    return getServicesOrFail()
  }

  private _plugins: ((app: PsychicApp) => void | Promise<void>)[] = []
  public get plugins() {
    return this._plugins
  }

  public async load<RT extends 'controllers' | 'services' | 'initializers'>(
    resourceType: RT,
    resourcePath: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    importCb: (path: string) => Promise<any>,
  ) {
    switch (resourceType) {
      case 'controllers':
        await importControllers(this, resourcePath, importCb)
        this._loadedControllers = true
        break

      case 'services':
        await importServices(resourcePath, importCb)
        this._loadedServices = true
        break

      case 'initializers':
        await importInitializers(resourcePath, importCb)
        break
    }
  }

  private booted = false
  public async boot(force: boolean = false) {
    if (this.booted && !force) return

    // await new IntegrityChecker().check()
    await this.inflections?.()

    this.booted = true
  }

  public use(on: PsychicUseEventType, handler: RequestHandler): void
  public use(handler: RequestHandler): void
  public use(handler: () => void): void
  public use(pathOrOnOrHandler: unknown, maybeHandler?: unknown): void {
    if (maybeHandler) {
      const eventType = pathOrOnOrHandler as PsychicUseEventType
      const handler = maybeHandler as () => void
      const wrappedHandler = (server: PsychicServer) => {
        server.expressApp.use(handler)
      }

      switch (eventType) {
        case 'before-middleware':
          this.on('server:init:before-middleware', wrappedHandler)
          break

        case 'after-middleware':
          this.on('server:init:after-middleware', wrappedHandler)
          break

        case 'after-routes':
          this.on('server:init:after-routes', wrappedHandler)
          break
        default:
          throw new Error(`missing required case handler for PsychicApp#use: "${eventType as string}"`)
      }
      return
    } else {
      const wrappedHandler = (server: PsychicServer) => {
        server.expressApp.use(pathOrOnOrHandler as RequestHandler)
      }
      this.on('server:init:after-middleware', wrappedHandler)
    }
  }

  public plugin(cb: (app: PsychicApp) => void | Promise<void>) {
    this._plugins.push(cb)
  }

  public on<T extends PsychicHookEventType>(
    hookEventType: T,
    cb: T extends 'server:error'
      ? (err: Error, req: Request, res: Response) => void | Promise<void>
      : T extends 'server:init:before-middleware'
        ? (psychicServer: PsychicServer) => void | Promise<void>
        : T extends 'server:init:after-middleware'
          ? (psychicServer: PsychicServer) => void | Promise<void>
          : T extends 'server:start'
            ? (psychicServer: PsychicServer) => void | Promise<void>
            : T extends 'server:shutdown'
              ? (psychicServer: PsychicServer) => void | Promise<void>
              : T extends 'server:init:after-routes'
                ? (psychicServer: PsychicServer) => void | Promise<void>
                : T extends 'cli:start'
                  ? (program: Command) => void | Promise<void>
                  : T extends 'cli:sync'
                    ? // NOTE: this is really any | Promise<any>, but eslint complains about this foolery
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      () => any
                    : (conf: PsychicApp) => void | Promise<void>,
  ) {
    switch (hookEventType) {
      case 'server:error':
        this._specialHooks.serverError.push(
          cb as (err: Error, req: Request, res: Response) => void | Promise<void>,
        )
        break

      case 'server:init:before-middleware':
        this._specialHooks.serverInitBeforeMiddleware.push(
          cb as (psychicServer: PsychicServer) => void | Promise<void>,
        )
        break

      case 'server:init:after-middleware':
        this._specialHooks.serverInitAfterMiddleware.push(
          cb as (psychicServer: PsychicServer) => void | Promise<void>,
        )
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

      case 'cli:sync':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._specialHooks['cliSync'].push(cb as () => any)
        break
    }
  }

  public set(option: 'openapi', name: string, value: NamedPsychicOpenapiOptions): void
  public set<Opt extends PsychicAppOption>(
    option: Opt,
    value: Opt extends 'appName'
      ? string
      : Opt extends 'apiOnly'
        ? boolean
        : Opt extends 'defaultResponseHeaders'
          ? Record<string, string | null>
          : Opt extends 'encryption'
            ? PsychicAppEncryptionOptions
            : Opt extends 'cors'
              ? CorsOptions
              : Opt extends 'cookie'
                ? CustomCookieOptions
                : Opt extends 'apiRoot'
                  ? string
                  : Opt extends 'importExtension'
                    ? GeneratorImportStyle
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
                                        : Opt extends 'packageManager'
                                          ? DreamAppAllowedPackageManagersEnum
                                          : Opt extends 'inflections'
                                            ? () => void | Promise<void>
                                            : Opt extends 'routes'
                                              ? (r: PsychicRouter) => void | Promise<void>
                                              : never,
  ): void
  public set<Opt extends PsychicAppOption>(option: Opt, unknown1: unknown, unknown2?: unknown) {
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

      case 'importExtension':
        this._importExtension = value as GeneratorImportStyle
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
        this._encryption = value as PsychicAppEncryptionOptions
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

      case 'packageManager':
        this._packageManager = value as DreamAppAllowedPackageManagersEnum
        break

      case 'saltRounds':
        this._saltRounds = value as number
        break

      case 'openapi':
        this._openapi = {
          ...this.openapi,
          [unknown2 ? (unknown1 as string) : 'default']: {
            outputFilepath: 'openapi.json',
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
        throw new Error(`Unhandled option type passed to PsychicApp#set: ${option}`)
    }
  }

  public override<Override extends keyof PsychicAppOverrides>(
    override: Override,
    value: PsychicAppOverrides[Override],
  ) {
    switch (override) {
      case 'server:start':
        this.overrides['server:start'] = value
    }
  }
}

export type PsychicAppOption =
  | 'appName'
  | 'apiOnly'
  | 'apiRoot'
  | 'importExtension'
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
  | 'packageManager'
  | 'paths'
  | 'port'
  | 'routes'
  | 'saltRounds'
  | 'ssl'

export interface PsychicAppSpecialHooks {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cliSync: (() => any)[]
  serverInitBeforeMiddleware: ((server: PsychicServer) => void | Promise<void>)[]
  serverInitAfterMiddleware: ((server: PsychicServer) => void | Promise<void>)[]
  serverInitAfterRoutes: ((server: PsychicServer) => void | Promise<void>)[]
  serverStart: ((server: PsychicServer) => void | Promise<void>)[]
  serverShutdown: ((server: PsychicServer) => void | Promise<void>)[]
  serverError: ((err: Error, req: Request, res: Response) => void | Promise<void>)[]
}

export interface PsychicAppOverrides {
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
  outputFilepath?: string
}

export interface NamedPsychicOpenapiOptions extends PsychicOpenapiBaseOptions {
  outputFilepath: string
}

interface PsychicOpenapiBaseOptions {
  /**
   * an optional block containing the version, title, and description of your app.
   *
   * ```ts
   * psy.set('openapi', {
   *   info: {
   *     version: 1,
   *     title: 'my app',
   *     description: 'openapi spec for my app'
   *   }
   * })
   * ```
   */
  info?: PsychicOpenapiInfo

  /**
   * an array of servers that your application is hosted on.
   *
   * ```ts
   * psy.set('openapi', {
   *   servers: [
   *     {
   *       url: 'https://myapp.com',
   *       variables: {
   *         myVar: {
   *           default: 'a',
   *           enum: ['a', 'b', 'c']
   *         }
   *       }
   *     }
   *   ],
   * })
   * ```
   */
  servers?: OpenapiServer[]

  /**
   * When true, all response fields utilizing openapi enums
   * will be converted strictly to strings, with a description
   * that explains the possible enum values instead. This approach
   * tends to be safer when your api is being consumed by
   * mobile applications, since they have strict deserialization
   * rules that will not permit new enum values to flow through,
   * meaning that if you ever decide to add or rename an enum
   * value, it would break that endpoint for users any time that
   * unrecognized enum value is sent. Mobile devs can push a fix
   * to accept the new version, but anyone on an outdated version
   * of the app would continue to experience the issue.
   *
   * ```ts
   * psy.set('openapi', 'mobile.openapi.json', {
   *   suppressResponseEnums: true,
   * })
   * ```
   */
  suppressResponseEnums?: boolean

  /**
   * When true, psychic will use the `openapi-typescript` package
   * to read this openapi.json file and create typescript interfaces
   * from it, which can then be leveraged throughout your app to
   * cast the values of response bodies. This is especially useful
   * in tests, where you are capturing your response bodies and
   * making assertions on their shape.
   *
   * ```ts
   * psy.set('openapi', {
   *   syncTypes: true,
   * })
   * ```
   *
   * With this done, you can leverage the `OpenapiResponseBody` type
   * utility to read the openapi paths exported from this types file
   * and use it to easily capture the response body payload.
   *
   * ```ts
   * import { openapiPaths } from '../../../src/types/openapi.js'
   *
   * it('succeeds', async () => {
   *   const res = await request.get('/posts', 200)
   *   const body = res.body as OpenapiResponseBody<openapiPaths, '/posts', 'get', 200>
   * })
   * ```
   */
  syncTypes?: boolean

  /**
   * an object containing default values for all endpoints,
   * like headers and responses.
   *
   * ```ts
   * psy.set('openapi', {
   *   defaults: {
   *     headers: {
   *       locale: {
   *         type: 'string',
   *         enum: LocalesEnumValues,
   *       }
   *     }
   *   }
   * })
   * ```
   */
  defaults?: {
    /**
     * an object containing the default headers for your app.
     * This will be applied to all endpoints, unless they
     * explicitly bypass default headers.
     *
     * ```ts
     * psy.set('openapi', {
     *   defaults: {
     *     headers: {
     *       locale: {
     *         type: 'string',
     *         enum: LocalesEnumValues,
     *       }
     *     }
     *   }
     * })
     * ```
     */
    headers?: OpenapiHeaders

    /**
     * an object containing the default responses for your app.
     * This will be applied to all endpoints, unless they
     * explicitly bypass default responses.
     *
     * Psychic provides default responses for errors like 400,
     * 401, 403, 404, 409, and 422, so only override these if
     * you need to either change or add to these values.
     *
     * ```ts
     * psy.set('openapi', {
     *   defaults: {
     *     headers: {
     *       locale: {
     *         type: 'string',
     *         enum: LocalesEnumValues,
     *       }
     *     }
     *   }
     * })
     * ```
     */
    responses?: OpenapiResponses

    /**
     * an object containing the default security schemes
     * for your app.
     *
     * ```ts
     * psy.set('openapi', {
     *   defaults: {
     *     securitySchemes: {
     *       myHttpAuth: {
     *         type: 'http'
     *         scheme: 'bearer'
     *       }
     *     }
     *   }
     * })
     * ```
     */
    securitySchemes?: OpenapiSecuritySchemes

    /**
     * an object containing the default security
     * for your app.
     *
     * ```ts
     * psy.set('openapi', {
     *   defaults: {
     *     security: {
     *       myHttpAuth: []
     *     }
     *   }
     * })
     * ```
     */
    security?: OpenapiSecurity

    /**
     * an object containing the default components
     * for your app.
     *
     * ```ts
     * psy.set('openapi', {
     *   defaults: {
     *     components: {
     *       schemas: {
     *         Chalupa: {
     *           delicious: boolean
     *         }
     *       }
     *     }
     *   }
     * })
     * ```
     */
    components?: {
      [key: string]: {
        [key: string]: OpenapiSchemaBody | OpenapiContent
      }
    }
  }
}

interface PsychicOpenapiInfo {
  version: string
  title: string
  description: string
}

interface PsychicPathOptions {
  apiRoutes?: string
  services?: string
  controllers?: string
  controllerSpecs?: string
}

export interface PsychicClientOptions {
  apiPath?: string
}

export type PsychicLogger = DreamLogger
export type PsychicLogLevel = DreamLogLevel

export type PsychicAppInitOptions = DreamAppInitOptions

export interface PsychicAppEncryptionOptions {
  cookies: SegmentedEncryptionOptions
}
interface SegmentedEncryptionOptions {
  current: EncryptOptions
  legacy?: EncryptOptions
}

// GeneratorImportStyles are used by CLI generators to determine how
// to style import suffixes. When integrating with other apps, this
// suffix style can change, and may need to be configured.
export const GeneratorImportStyles = ['.js', '.ts', 'none'] as const
export type GeneratorImportStyle = (typeof GeneratorImportStyles)[number]
