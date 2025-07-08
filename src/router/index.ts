import {
  CheckConstraintViolation,
  DataTypeColumnTypeMismatch,
  NotNullViolation,
  RecordNotFound,
  ValidationError,
  camelize,
} from '@rvoh/dream'
import { Express, Request, RequestHandler, Response, Router } from 'express'
import pluralize from 'pluralize-esm'
import PsychicController from '../controller/index.js'
import ParamValidationError from '../error/controller/ParamValidationError.js'
import ParamValidationErrors from '../error/controller/ParamValidationErrors.js'
import HttpError from '../error/http/index.js'
import EnvInternal from '../helpers/EnvInternal.js'
import errorIsRescuableHttpError from '../helpers/error/errorIsRescuableHttpError.js'
import PsychicApp from '../psychic-app/index.js'
import {
  NamespaceConfig,
  PsychicControllerActions,
  applyResourceAction,
  applyResourcesAction,
  convertRouteParams,
  lookupControllerOrFail,
  routePath,
} from '../router/helpers.js'
import RouteManager, { ControllerActionRouteConfig, MiddlewareRouteConfig } from './route-manager.js'
import {
  HttpMethod,
  ResourceMethods,
  ResourcesMethodType,
  ResourcesMethods,
  ResourcesOptions,
} from './types.js'

export default class PsychicRouter {
  public app: Express
  public config: PsychicApp
  public currentNamespaces: NamespaceConfig[] = []
  public routeManager: RouteManager = new RouteManager()
  constructor(app: Express, config: PsychicApp) {
    this.app = app
    this.config = config
  }

  public get routingMechanism(): Express | Router {
    return this.app
  }

  public get routes() {
    return this.routeManager.routes
  }

  private get currentNamespacePaths() {
    return this.currentNamespaces.map(n => n.namespace)
  }

  // this is called after all routes have been processed.
  public commit() {
    this.routes.forEach(route => {
      if ((route as MiddlewareRouteConfig).middleware) {
        const routeConf = route as MiddlewareRouteConfig
        this.app[routeConf.httpMethod](
          routePath(routeConf.path),
          ...(Array.isArray(routeConf.middleware) ? routeConf.middleware : [routeConf.middleware]),
        )
      } else {
        const routeConf = route as ControllerActionRouteConfig
        this.app[routeConf.httpMethod](routePath(routeConf.path), (req, res) => {
          this.handle(routeConf.controller, routeConf.action, { req, res }).catch(() => {})
        })
      }
    })
  }

  get(path: string): void
  get(path: string, middleware: RequestHandler | RequestHandler[]): void
  get<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  get(path: string, controller?: unknown, action?: unknown) {
    this.crud('get', path, controller as typeof PsychicController, action as string)
  }

  post(path: string): void
  post(path: string, middleware: RequestHandler | RequestHandler[]): void
  post<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  post<T extends typeof PsychicController>(
    path: string,
    controller?: T,
    action?: PsychicControllerActions<T>,
  ) {
    this.crud('post', path, controller as typeof PsychicController, action as string)
  }

  put(path: string): void
  put(path: string, middleware: RequestHandler | RequestHandler[]): void
  put<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  put<T extends typeof PsychicController>(
    path: string,
    controller?: T,
    action?: PsychicControllerActions<T>,
  ) {
    this.crud('put', path, controller as typeof PsychicController, action as string)
  }

  patch(path: string): void
  patch(path: string, middleware: RequestHandler | RequestHandler[]): void
  patch<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  patch<T extends typeof PsychicController>(
    path: string,
    controller?: T,
    action?: PsychicControllerActions<T>,
  ) {
    this.crud('patch', path, controller as typeof PsychicController, action as string)
  }

  delete(path: string): void
  delete(path: string, middleware: RequestHandler | RequestHandler[]): void
  delete<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  delete<T extends typeof PsychicController>(
    path: string,
    controller?: T,
    action?: PsychicControllerActions<T>,
  ) {
    this.crud('delete', path, controller as typeof PsychicController, action as string)
  }

  options(path: string): void
  options(path: string, middleware: RequestHandler | RequestHandler[]): void
  options<T extends typeof PsychicController>(
    path: string,
    controller: T,
    action: PsychicControllerActions<T>,
  ): void
  options<T extends typeof PsychicController>(
    path: string,
    controller?: T,
    action?: PsychicControllerActions<T>,
  ) {
    this.crud('options', path, controller as typeof PsychicController, action as string)
  }

  private prefixPathWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return '/' + this.currentNamespacePaths.join('/') + '/' + str
  }

  public crud(httpMethod: HttpMethod, path: string): void
  public crud(httpMethod: HttpMethod, path: string, middleware: RequestHandler | RequestHandler[]): void
  public crud(
    httpMethod: HttpMethod,
    path: string,
    controller: typeof PsychicController,
    action: string,
  ): void
  public crud(httpMethod: HttpMethod, path: string, controllerOrMiddleware?: unknown, action?: string) {
    this.checkPathForInvalidChars(path)

    const isMiddleware =
      (typeof controllerOrMiddleware === 'function' || Array.isArray(controllerOrMiddleware)) &&
      !(controllerOrMiddleware as typeof PsychicController)?.isPsychicController

    // devs can provide custom express middleware which bypasses
    // the normal Controller#action paradigm.
    if (isMiddleware) {
      this.routeManager.addMiddleware({
        httpMethod,
        path: this.prefixPathWithNamespaces(path),
        middleware: controllerOrMiddleware as RequestHandler | RequestHandler[],
      })
    } else {
      controllerOrMiddleware ||= lookupControllerOrFail(this, { path, httpMethod })
      action ||= path.replace(/^\//, '')
      if (action.match(/\//))
        throw new Error('action cant have a slash in it - action was inferred from path')

      this.routeManager.addRoute({
        httpMethod,
        path: this.prefixPathWithNamespaces(path),
        controller: controllerOrMiddleware as typeof PsychicController,
        action,
      })
    }
  }

  private checkPathForInvalidChars(path: string) {
    if (path.includes('{'))
      throw new Error(`
The provided route "${path}" contains characters that are not supported.
If you are trying to write a uri param, you will need to use expressjs
param syntax, which is a prefixing colon, rather than using brackets
to surround the param.

provided route: "${path}"
suggested fix:  "${convertRouteParams(path)}"
`)
  }

  public namespace(namespace: string, cb: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    this.runNestedCallbacks(namespace, nestedRouter, cb)
  }

  public scope(scope: string, cb: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    this.runNestedCallbacks(scope, nestedRouter, cb, { treatNamespaceAsScope: true })
  }

  public resources(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void),
    cb?: (router: PsychicNestedRouter) => void,
  ) {
    return this.makeResource(path, optionsOrCb, cb, true)
  }

  public resource(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void),
    cb?: (router: PsychicNestedRouter) => void,
  ) {
    return this.makeResource(path, optionsOrCb, cb, false)
  }

  public collection(cb: (router: PsychicNestedRouter) => void) {
    const replacedNamespaces = this.currentNamespaces.slice(0, this.currentNamespaces.length - 1)
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: replacedNamespaces,
    })
    const currentNamespace = replacedNamespaces[replacedNamespaces.length - 1]
    if (!currentNamespace)
      throw new Error('Must be within a `resources` declaration to call the collection method')

    cb(nestedRouter)
  }

  private makeResource(
    path: string,
    optionsOrCb: ResourcesOptions | ((router: PsychicNestedRouter) => void) | undefined,
    cb: ((router: PsychicNestedRouter) => void) | undefined,
    plural: boolean,
  ) {
    if (cb) {
      if (typeof optionsOrCb === 'function')
        throw new Error('cannot pass a function as a second arg when passing 3 args')
      this._makeResource(path, optionsOrCb as ResourcesOptions, cb, plural)
    } else {
      if (typeof optionsOrCb === 'function') this._makeResource(path, undefined, optionsOrCb, plural)
      else this._makeResource(path, optionsOrCb, undefined, plural)
    }
  }

  private _makeResource(
    path: string,
    options: ResourcesOptions | undefined,
    cb: ((router: PsychicNestedRouter) => void) | undefined,
    plural: boolean,
  ) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    const { only, except } = options || {}
    let resourceMethods: ResourcesMethodType[] = plural ? ResourcesMethods : ResourceMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = resourceMethods.filter(m => !except.includes(m))
    }

    const originalCurrentNamespaces = this.currentNamespaces
    this.makeRoomForNewIdParam(nestedRouter)
    this.runNestedCallbacks(path, nestedRouter, cb, { asMember: plural, resourceful: true })
    this.currentNamespaces = originalCurrentNamespaces

    resourceMethods.forEach(action => {
      if (plural) {
        applyResourcesAction(path, action, nestedRouter, options)
      } else {
        applyResourceAction(path, action, nestedRouter, options)
      }
    })
  }

  private runNestedCallbacks(
    namespace: string,
    nestedRouter: PsychicNestedRouter,
    cb?: (router: PsychicNestedRouter) => void,
    {
      asMember = false,
      resourceful = false,
      treatNamespaceAsScope = false,
    }: {
      asMember?: boolean
      resourceful?: boolean
      treatNamespaceAsScope?: boolean
    } = {},
  ) {
    this.addNamespace(namespace, resourceful, { nestedRouter, treatNamespaceAsScope })

    if (asMember) {
      this.addNamespace(':id', resourceful, { nestedRouter, treatNamespaceAsScope: true })
    }

    if (cb) cb(nestedRouter)

    this.removeLastNamespace(nestedRouter)
    if (asMember) this.removeLastNamespace(nestedRouter)
  }

  private addNamespace(
    namespace: string,
    resourceful: boolean,
    {
      nestedRouter,
      treatNamespaceAsScope,
    }: {
      nestedRouter?: PsychicNestedRouter
      treatNamespaceAsScope?: boolean
    } = {},
  ) {
    this.currentNamespaces = [
      ...this.currentNamespaces,
      {
        namespace,
        resourceful,
        isScope: treatNamespaceAsScope || false,
      },
    ]

    if (nestedRouter) nestedRouter.currentNamespaces = this.currentNamespaces
  }

  private removeLastNamespace(nestedRouter?: PsychicNestedRouter) {
    this.currentNamespaces.pop()
    if (nestedRouter) nestedRouter.currentNamespaces = this.currentNamespaces
  }

  private makeRoomForNewIdParam(nestedRouter?: PsychicNestedRouter) {
    this.currentNamespaces = [
      ...this.currentNamespaces.map((namespace, index) => {
        const previousNamespace = this.currentNamespaces[index - 1]
        if (namespace.namespace === ':id' && previousNamespace) {
          return {
            ...namespace,
            namespace: `:${camelize(pluralize.singular(previousNamespace.namespace))}Id`,
          }
        } else return namespace
      }),
    ]
    if (nestedRouter) nestedRouter.currentNamespaces = this.currentNamespaces
  }

  public async handle(
    controller: typeof PsychicController,
    action: string,
    {
      req,
      res,
    }: {
      req: Request
      res: Response
    },
  ) {
    const controllerInstance = this._initializeController(controller, req, res, action)
    if (typeof controllerInstance[action as keyof typeof controllerInstance] !== 'function') {
      res.sendStatus(404)
      return
    }

    try {
      await controllerInstance.runAction(action)
    } catch (error) {
      const err = error as Error
      if (!EnvInternal.isTest) PsychicApp.logWithLevel('error', err.message)

      if (errorIsRescuableHttpError(err)) {
        const httpErr = err as HttpError
        if (httpErr.data) {
          res.status(httpErr.status).json(httpErr.data)
        } else {
          res.sendStatus(httpErr.status)
        }
      } else if (err instanceof RecordNotFound) {
        res.sendStatus(404)
      } else if (
        err instanceof DataTypeColumnTypeMismatch ||
        err instanceof NotNullViolation ||
        err instanceof CheckConstraintViolation
      ) {
        res.status(422).json()
      } else if (err instanceof ValidationError) {
        res.status(422).json({ errors: err.errors || {} })
      } else if (err instanceof ParamValidationError) {
        res.status(400).json({
          errors: {
            [err.paramName]: err.errorMessages,
          },
        })
      } else if (err instanceof ParamValidationErrors) {
        res.status(400).json({
          errors: err.errors,
        })
      } else {
        // by default, ts-node will mask these errors for no good reason, causing us
        // to have to apply an ugly and annoying try-catch pattern to our controllers
        // and manually console log the error to determine what the actual error was.
        // this block enables us to not have to do that anymore.
        if (EnvInternal.isTest && !EnvInternal.boolean('PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR')) {
          PsychicApp.log('ATTENTION: a server error was detected:')
          PsychicApp.logWithLevel('error', err)
        }

        if (this.config.specialHooks.serverError.length) {
          try {
            for (const hook of this.config.specialHooks.serverError) {
              await hook(err, req, res)
            }
          } catch (error) {
            if (EnvInternal.isDevelopmentOrTest) {
              // In development and test, we want to throw so that, for example, double-setting of
              // status headers throws an error in specs. We couldn't figure out how to write
              // a spec for ensuring that such errors made it through because Supertest would
              // respond with the first header sent, which was successful, and the exception only
              // happened when Jest ended the spec.
              throw error
            } else {
              PsychicApp.logWithLevel(
                'error',
                `
                  Something went wrong while attempting to call your custom server:error hooks.
                  Psychic will rescue errors thrown here to prevent the server from crashing.
                  The error thrown is:
                `,
              )
              PsychicApp.logWithLevel('error', error)
            }
          }
        } else throw err
      }
    }
  }

  public _initializeController(
    ControllerClass: typeof PsychicController,
    req: Request,
    res: Response,
    action: string,
  ) {
    return new ControllerClass(req, res, {
      config: this.config,
      action,
    })
  }
}

export class PsychicNestedRouter extends PsychicRouter {
  public router: Router
  constructor(
    app: Express,
    config: PsychicApp,
    routeManager: RouteManager,
    {
      namespaces = [],
    }: {
      namespaces?: NamespaceConfig[]
    } = {},
  ) {
    super(app, config)
    this.router = Router()
    this.currentNamespaces = namespaces
    this.routeManager = routeManager
  }

  public override get routingMechanism() {
    return this.router
  }
}
