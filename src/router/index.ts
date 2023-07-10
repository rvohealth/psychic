import { Application, Request, Response, Router } from 'express'
import { HttpMethod, ResourceMethods, ResourcesMethods, ResourcesMethodType, ResourcesOptions } from './types'
import {
  applyResourceAction,
  applyResourcesAction,
  routePath,
  sanitizedControllerPath,
} from '../router/helpers'
import Unauthorized from '../error/http/unauthorized'
import Forbidden from '../error/http/forbidden'
import UnprocessableEntity from '../error/http/unprocessable-entity'
import NotFound from '../error/http/not-found'
import PsychicConfig from '../config'
import log from '../log'
import PsychicController from '../controller'
import { ValidationError } from 'dream'
import RouteManager from './route-manager'
import pluralize = require('pluralize')
import { pascalize, snakeify } from 'dream'
import BadRequest from '../error/http/bad-request'
import InternalServerError from '../error/http/internal-server-error'
import NotImplemented from '../error/http/not-implemented'
import ServiceUnavailable from '../error/http/service-unavailable'

export default class PsychicRouter {
  public app: Application
  public config: PsychicConfig
  public currentNamespaces: NamespaceConfig[] = []
  public routeManager: RouteManager = new RouteManager()
  constructor(app: Application, config: PsychicConfig) {
    this.app = app
    this.config = config
  }

  public get routingMechanism(): Application | Router {
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
      this.app[route.httpMethod](routePath(route.path), async (req, res) => {
        await this.handle(route.controllerActionString, { req, res })
      })
    })
  }

  get(path: string, controllerActionString: string) {
    this.crud('get', path, controllerActionString)
  }

  post(path: string, controllerActionString: string) {
    this.crud('post', path, controllerActionString)
  }

  put(path: string, controllerActionString: string) {
    this.crud('put', path, controllerActionString)
  }

  patch(path: string, controllerActionString: string) {
    this.crud('patch', path, controllerActionString)
  }

  delete(path: string, controllerActionString: string) {
    this.crud('delete', path, controllerActionString)
  }

  private prefixControllerActionStringWithNamespaces(controllerActionString: string) {
    const [controllerName] = controllerActionString.split('#')
    const filteredNamespaces = this.currentNamespaces.filter(
      n => !n.isScope && !(n.resourceful && pascalize(n.namespace) === controllerName)
    )
    if (!filteredNamespaces.length) return controllerActionString
    return filteredNamespaces.map(str => pascalize(str.namespace)).join('/') + '/' + controllerActionString
  }

  private prefixPathWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return '/' + this.currentNamespacePaths.join('/') + '/' + str
  }

  public crud(httpMethod: HttpMethod, path: string, controllerActionString: string) {
    this.routeManager.addRoute({
      httpMethod,
      path: this.prefixPathWithNamespaces(path),
      controllerActionString: this.prefixControllerActionStringWithNamespaces(controllerActionString),
    })
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
    cb?: (router: PsychicNestedRouter) => void
  ) {
    if (cb) {
      if (typeof optionsOrCb === 'function')
        throw 'cannot pass a function as a second arg when passing 3 args'
      this._resources(path, optionsOrCb as ResourcesOptions, cb)
    } else {
      if (typeof optionsOrCb === 'function') this._resources(path, undefined, optionsOrCb)
      else this._resources(path, optionsOrCb, undefined)
    }
  }

  public resource(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void),
    cb?: (router: PsychicNestedRouter) => void
  ) {
    if (cb) {
      if (typeof optionsOrCb === 'function')
        throw 'cannot pass a function as a second arg when passing 3 args'
      this._resource(path, optionsOrCb as ResourcesOptions, cb)
    } else {
      if (typeof optionsOrCb === 'function') this._resource(path, undefined, cb)
      else this._resource(path, optionsOrCb, undefined)
    }
  }

  private _resources(path: string, options?: ResourcesOptions, cb?: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    const only = options?.only
    const except = options?.except
    let resourceMethods: ResourcesMethodType[] = ResourcesMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = ResourcesMethods.filter(
        m => !except.includes(m as ResourcesMethodType)
      ) as ResourcesMethodType[]
    }

    this.makeRoomForNewIdParam(nestedRouter)
    resourceMethods.forEach(action => {
      applyResourcesAction(path, action, nestedRouter)
    })

    this.runNestedCallbacks(path, nestedRouter, cb, { asMember: true, resourceful: true })
  }

  private _resource(path: string, options?: ResourcesOptions, cb?: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager)
    const { only, except } = options || {}
    let resourceMethods: ResourcesMethodType[] = ResourceMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = ResourceMethods.filter(
        m => !except.includes(m as ResourcesMethodType)
      ) as ResourcesMethodType[]
    }

    resourceMethods.forEach(action => {
      applyResourceAction(path, action, nestedRouter)
    })

    this.runNestedCallbacks(path, nestedRouter, cb)
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
    } = {}
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
    } = {}
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
            namespace: `:${snakeify(pluralize.singular(previousNamespace.namespace))}_id`,
          }
        } else return namespace
      }),
    ]
    if (nestedRouter) nestedRouter.currentNamespaces = this.currentNamespaces
  }

  public async handle(
    controllerActionString: string,
    {
      req,
      res,
    }: {
      req: Request
      res: Response
    }
  ) {
    const [controllerPath, action] = controllerActionString.split('#')

    const ControllerClass = this.config.controllers[sanitizedControllerPath(controllerPath)]
    if (!ControllerClass) {
      res.status(501).send(`
        The controller you are attempting to load was not found:
          ${controllerPath}
      `)
      return
    }

    const controller = this._initializeController(ControllerClass, req, res)

    if (!(controller as any)[action]) {
      res.status(501).send(`
        The method ${action} is not defined controller:
          ${controllerPath}
      `)
      return
    }

    try {
      await controller.runAction(action)
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') await log.error(err as string)

      switch ((err as any).constructor) {
        case Unauthorized:
        case Forbidden:
        case NotFound:
        case BadRequest:
        case InternalServerError:
        case NotImplemented:
        case ServiceUnavailable:
          res.sendStatus((err as any).status)
          break

        case ValidationError:
          const validationError = err as ValidationError
          const errors = validationError.errors || ([] as ValidationError[])
          res.status(422).json({
            errors,
          })
          break

        case UnprocessableEntity:
          res.status(422).json((err as any).data)
          break

        default:
          res.status(500).send(`
            An unexpected error has caused this request to crash.
              error:
                ${err}
          `)
      }
    }
  }

  public _initializeController(ControllerClass: typeof PsychicController, req: Request, res: Response) {
    return new ControllerClass(req, res, {
      config: this.config,
    })
  }
}

export class PsychicNestedRouter extends PsychicRouter {
  public router: Router
  constructor(
    app: Application,
    config: PsychicConfig,
    routeManager: RouteManager,
    {
      namespaces = [],
    }: {
      namespaces?: NamespaceConfig[]
    } = {}
  ) {
    super(app, config)
    this.router = Router()
    this.currentNamespaces = namespaces
    this.routeManager = routeManager
  }

  public get routingMechanism() {
    return this.router
  }
}

export interface NamespaceConfig {
  namespace: string
  resourceful: boolean
  isScope: boolean
}
