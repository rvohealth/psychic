import { Application, Request, Response, Router } from 'express'
import { HttpMethod, ResourceMethods, ResourceMethodType, ResourcesOptions } from './types'
import { applyResourceAction, applyResourcesAction, routePath } from '../router/helpers'
import Encrypt from '../encryption/encrypt'
import Unauthorized from '../error/http/unauthorized'
import Forbidden from '../error/http/forbidden'
import UnprocessableEntity from '../error/http/unprocessable-entity'
import NotFound from '../error/http/not-found'
import PsychicConfig from '../config'
import log from '../log'
import PsychicController from '../controller'
import { ValidationError } from 'dream'
import pascalize from '../helpers/pascalize'

export default class PsychicRouter {
  public app: Application
  public config: PsychicConfig
  public routes: RouteConfig[] = []
  protected currentNamespaces: string[] = []
  constructor(app: Application, config: PsychicConfig) {
    this.app = app
    this.config = config
  }

  public get routingMechanism(): Application | Router {
    return this.app
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

  private prefixModelNameWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return this.currentNamespaces.map(str => pascalize(str)).join('/') + '/' + str
  }

  private prefixPathWithNamespaces(str: string) {
    if (!this.currentNamespaces.length) return str
    return this.currentNamespaces.join('/') + '/' + str
  }

  public crud(httpMethod: HttpMethod, path: string, controllerActionString: string) {
    const fullPath = this.prefixPathWithNamespaces(path)
    const fullControllerActionString = this.prefixModelNameWithNamespaces(controllerActionString)
    this.routes.push({
      httpMethod,
      path,
      controllerActionString,
    })
    this.app[httpMethod](routePath(fullPath), async (req, res) => {
      await this.handle(fullControllerActionString, { req, res })
    })
  }

  public namespace(path: string, cb: (router: PsychicNestedRouter) => void) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, {
      namespaces: this.currentNamespaces,
    })
    this.currentNamespaces.push(path)
    cb(nestedRouter)
    this.currentNamespaces.pop()
    this.app.use(routePath(path), nestedRouter.router)
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
      if (typeof optionsOrCb === 'function') this._resources(path, undefined, cb)
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

    resourceMethods.forEach(action => {
      applyResourcesAction(path, action, nestedRouter)
    })

    this.currentNamespaces.push(path)
    if (cb) cb(nestedRouter)
    this.currentNamespaces.pop()

    this.app.use(routePath(path), nestedRouter.router)
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

    this.currentNamespaces.push(path)
    if (cb) cb(nestedRouter)
    this.currentNamespaces.pop()

    this.app.use(routePath(path), nestedRouter.router)
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

    const ControllerClass = this.config.controllers[controllerPath]
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
      namespaces?: string[]
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

export interface RouteConfig {
  controllerActionString: string
  path: string
  httpMethod: string
}
