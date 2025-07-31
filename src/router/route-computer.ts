import { camelize } from '@rvoh/dream'
import { RequestHandler, Router } from 'express'
import pluralize from 'pluralize-esm'
import PsychicController from '../controller/index.js'
import PsychicApp from '../psychic-app/index.js'
import {
  NamespaceConfig,
  PsychicControllerActions,
  applyResourceAction,
  applyResourcesAction,
  convertRouteParams,
  lookupControllerOrFail,
} from './helpers.js'
import RouteManager from './route-manager.js'
import {
  HttpMethod,
  ResourceMethods,
  ResourcesMethodType,
  ResourcesMethods,
  ResourcesOptions,
} from './types.js'

export default class PsychicRouteComputer {
  public config: PsychicApp
  public currentNamespaces: NamespaceConfig[] = []
  public routeManager: RouteManager = new RouteManager()
  constructor(config: PsychicApp) {
    this.config = config
  }

  public get routes() {
    return this.routeManager.routes
  }

  private get currentNamespacePaths() {
    return this.currentNamespaces.map(n => n.namespace)
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

  public namespace(namespace: string, cb: (router: PsychicNestedRouteComputer) => void) {
    const nestedRouter = new PsychicNestedRouteComputer(this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    this.runNestedCallbacks(namespace, nestedRouter, cb)
  }

  public scope(scope: string, cb: (router: PsychicNestedRouteComputer) => void) {
    const nestedRouter = new PsychicNestedRouteComputer(this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    this.runNestedCallbacks(scope, nestedRouter, cb, { treatNamespaceAsScope: true })
  }

  public resources(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouteComputer) => void),
    cb?: (router: PsychicNestedRouteComputer) => void,
  ) {
    return this.makeResource(path, optionsOrCb, cb, true)
  }

  public resource(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouteComputer) => void),
    cb?: (router: PsychicNestedRouteComputer) => void,
  ) {
    return this.makeResource(path, optionsOrCb, cb, false)
  }

  public collection(cb: (router: PsychicNestedRouteComputer) => void) {
    const replacedNamespaces = this.currentNamespaces.slice(0, this.currentNamespaces.length - 1)
    const nestedRouter = new PsychicNestedRouteComputer(this.config, this.routeManager, {
      namespaces: replacedNamespaces,
    })
    const currentNamespace = replacedNamespaces[replacedNamespaces.length - 1]
    if (!currentNamespace)
      throw new Error('Must be within a `resources` declaration to call the collection method')

    cb(nestedRouter)
  }

  private makeResource(
    path: string,
    optionsOrCb: ResourcesOptions | ((router: PsychicNestedRouteComputer) => void) | undefined,
    cb: ((router: PsychicNestedRouteComputer) => void) | undefined,
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
    cb: ((router: PsychicNestedRouteComputer) => void) | undefined,
    plural: boolean,
  ) {
    const nestedRouter = new PsychicNestedRouteComputer(this.config, this.routeManager, {
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
    nestedRouter: PsychicNestedRouteComputer,
    cb?: (router: PsychicNestedRouteComputer) => void,
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
      nestedRouter?: PsychicNestedRouteComputer
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

  private removeLastNamespace(nestedRouter?: PsychicNestedRouteComputer) {
    this.currentNamespaces.pop()
    if (nestedRouter) nestedRouter.currentNamespaces = this.currentNamespaces
  }

  private makeRoomForNewIdParam(nestedRouter?: PsychicNestedRouteComputer) {
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
}

export class PsychicNestedRouteComputer extends PsychicRouteComputer {
  public router: Router
  constructor(
    config: PsychicApp,
    routeManager: RouteManager,
    {
      namespaces = [],
    }: {
      namespaces?: NamespaceConfig[]
    } = {},
  ) {
    super(config)
    this.router = Router()
    this.currentNamespaces = namespaces
    this.routeManager = routeManager
  }
}
