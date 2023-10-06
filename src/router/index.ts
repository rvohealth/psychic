import { Application, Request, Response, Router } from 'express'
import { HttpMethod, ResourceMethods, ResourcesMethods, ResourcesMethodType, ResourcesOptions } from './types'
import {
  applyResourceAction,
  applyResourcesAction,
  routePath,
  sanitizedControllerPath,
} from '../router/helpers'
import PsychicConfig from '../config'
import log from '../log'
import PsychicController from '../controller'
import { ValidationError, camelize, developmentOrTestEnv } from '@rvohealth/dream'
import RouteManager from './route-manager'
import { pascalize, snakeify } from '@rvohealth/dream'
import pluralize = require('pluralize')
import absoluteSrcPath from '../helpers/absoluteSrcPath'
import importFileWithDefault from '../helpers/importFileWithDefault'
import server from '../../test-app/conf/server'

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

  options(path: string, controllerActionString: string) {
    this.crud('options', path, controllerActionString)
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
    return this.makeResource(path, optionsOrCb, cb, true)
  }

  public resource(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouter) => void),
    cb?: (router: PsychicNestedRouter) => void
  ) {
    return this.makeResource(path, optionsOrCb, cb, false)
  }

  public collection(cb: (router: PsychicNestedRouter) => void) {
    const replacedNamespaces = this.currentNamespaces.slice(0, this.currentNamespaces.length - 1)
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: replacedNamespaces,
    })
    const currentNamespace = replacedNamespaces[replacedNamespaces.length - 1]
    if (!currentNamespace) throw 'Must be within a resource to call the collection method'

    cb(nestedRouter)
  }

  private makeResource(
    path: string,
    optionsOrCb: ResourcesOptions | ((router: PsychicNestedRouter) => void) | undefined,
    cb: ((router: PsychicNestedRouter) => void) | undefined,
    plural: boolean
  ) {
    if (cb) {
      if (typeof optionsOrCb === 'function')
        throw 'cannot pass a function as a second arg when passing 3 args'
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
    plural: boolean
  ) {
    const nestedRouter = new PsychicNestedRouter(this.app, this.config, this.routeManager, {
      namespaces: this.currentNamespaces,
    })

    const { only, except } = options || {}
    let resourceMethods: ResourcesMethodType[] = plural ? ResourcesMethods : ResourceMethods

    if (only) {
      resourceMethods = only
    } else if (except) {
      resourceMethods = resourceMethods.filter(
        m => !except.includes(m as ResourcesMethodType)
      ) as ResourcesMethodType[]
    }

    this.makeRoomForNewIdParam(nestedRouter)

    this.runNestedCallbacks(path, nestedRouter, cb, { asMember: plural, resourceful: true })

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
            namespace: `:${camelize(pluralize.singular(previousNamespace.namespace))}Id`,
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

    let serverErrorHandler = async (err: unknown, req: Request, res: Response) => {}
    try {
      serverErrorHandler = await importFileWithDefault(absoluteSrcPath('conf/hooks/server-error'))
    } catch (_) {
      // ok if this file isn't present
    }

    try {
      await controller.runAction(action)
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') await log.error(err as string)

      switch ((err as any).constructor?.name) {
        case 'Unauthorized':
        case 'Forbidden':
        case 'NotFound':
        case 'BadRequest':
        case 'NotImplemented':
        case 'ServiceUnavailable':
          res.sendStatus((err as any).status)
          break

        case 'ValidationError':
          const validationError = err as ValidationError
          const errors = validationError.errors || ([] as ValidationError[])
          res.status(422).json({
            errors,
          })
          break

        case 'UnprocessableEntity':
          res.status(422).json((err as any).data)
          break

        case 'InternalServerError':
        default:
          await serverErrorHandler(err, req, res)
          throw err
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
