import { Application, Request, Response, Router } from 'express'
import { HttpMethod, ResourceMethods, ResourceMethodType, ResourcesOptions } from './types'
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
import pascalize from '../helpers/pascalize'
import RouteManager from './route-manager'
import pluralize = require('pluralize')
import snakeify from '../helpers/snakeify'

const routeManager = new RouteManager()
export default class PsychicRouter {
  public app: Application
  public config: PsychicConfig
  public currentNamespaces: NamespaceConfig[] = []
  constructor(app: Application, config: PsychicConfig) {
    this.app = app
    this.config = config
  }

  public get routingMechanism(): Application | Router {
    return this.app
  }

  public get routes() {
    return routeManager.routes
  }

  public reset() {
    routeManager.routes = []
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

  private prefixControllerActionStringWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return (
      this.currentNamespacePaths
        .filter(n => !/^:/.test(n))
        .map(str => pascalize(str))
        .join('/') +
      '/' +
      str
    )
  }

  private prefixPathWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return '/' + this.currentNamespacePaths.join('/') + '/' + str
  }

  public crud(httpMethod: HttpMethod, path: string, controllerActionString: string) {
    routeManager.addRoute({
      httpMethod,
      path: this.prefixPathWithNamespaces(path),
      controllerActionString: this.prefixControllerActionStringWithNamespaces(controllerActionString),
    })
  }

  public namespace(namespace: string, cb: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, {
      namespaces: this.currentNamespaces,
    })

    this.runNestedCallbacks(namespace, nestedRouter, cb)
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
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, {
      namespaces: this.currentNamespaces,
    })

    const only = options?.only
    const except = options?.except
    let resourceMethods: ResourceMethodType[] = ResourceMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = ResourceMethods.filter(
        m => !except.includes(m as ResourceMethodType)
      ) as ResourceMethodType[]
    }

    this.makeRoomForNewIdParam(nestedRouter)
    resourceMethods.forEach(action => {
      applyResourcesAction(path, action, nestedRouter)
    })

    this.runNestedCallbacks(path, nestedRouter, cb, { asMember: true, resourceful: true })
  }

  private runNestedCallbacks(
    namespace: string,
    nestedRouter: PsychicNestedRouter,
    cb?: (router: PsychicNestedRouter) => void,
    {
      asMember = false,
      resourceful = false,
    }: {
      asMember?: boolean
      resourceful?: boolean
    } = {}
  ) {
    this.addNamespace(namespace, resourceful, nestedRouter)

    if (asMember) {
      this.addNamespace(':id', resourceful, nestedRouter)
    }

    if (cb) cb(nestedRouter)

    this.removeLastNamespace(nestedRouter)
    if (asMember) this.removeLastNamespace(nestedRouter)
  }

  private addNamespace(namespace: string, resourceful: boolean, nestedRouter?: PsychicNestedRouter) {
    this.currentNamespaces = [
      ...this.currentNamespaces,
      {
        namespace,
        resourceful,
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

  private _resource(path: string, options?: ResourcesOptions, cb?: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config)
    const { only, except } = options || {}
    let resourceMethods: ResourceMethodType[] = ResourceMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = ResourceMethods.filter(
        m => !except.includes(m as ResourceMethodType)
      ) as ResourceMethodType[]
    }

    resourceMethods.forEach(action => {
      applyResourceAction(path, action, nestedRouter)
    })

    this.runNestedCallbacks(path, nestedRouter, cb)
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
    {
      namespaces = [],
    }: {
      namespaces?: NamespaceConfig[]
    } = {}
  ) {
    super(app, config)
    this.router = Router()
    this.currentNamespaces = namespaces
  }

  public get routingMechanism() {
    return this.router
  }
}

export interface NamespaceConfig {
  namespace: string
  resourceful: boolean
}
