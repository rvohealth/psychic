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
import { ValidationError, camelize, developmentOrTestEnv, testEnv } from '@rvohealth/dream'
import RouteManager from './route-manager'
import { pascalize } from '@rvohealth/dream'
import pluralize = require('pluralize')
import HttpError from '../error/http'
import { ValidationType } from '@rvohealth/dream/src/decorators/validations/shared'
import { ParamValidationError } from '../server/params'

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
      this.app[route.httpMethod](routePath(route.path), (req, res) => {
        this.handle(route.controllerActionString, { req, res }).catch(() => {})
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
      n => !n.isScope && !(n.resourceful && pascalize(n.namespace) === controllerName),
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
    if (!currentNamespace) throw 'Must be within a resource to call the collection method'

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
    controllerActionString: string,
    {
      req,
      res,
    }: {
      req: Request
      res: Response
    },
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const controllerAction = (controller as any)[action]

    if (!controllerAction) {
      res.status(501).send(`
        The method ${action} is not defined controller:
          ${controllerPath}
      `)
      return
    }

    try {
      await controller.runAction(action)
    } catch (error) {
      const err = error as Error
      if (process.env.NODE_ENV !== 'test') log.error(err.message)

      let validationError: ValidationError
      let paramValidationError: ParamValidationError
      let validationErrors: Record<string, ValidationType[]>
      let errorsJson: object = {}

      switch (err.constructor?.name) {
        case 'Unauthorized':
        case 'Forbidden':
        case 'NotFound':
        case 'Conflict':
        case 'BadRequest':
        case 'NotImplemented':
        case 'ServiceUnavailable':
          res.sendStatus((err as HttpError).status)
          break

        case 'RecordNotFound':
          res.sendStatus(404)
          break

        case 'ValidationError':
          validationError = err as ValidationError
          validationErrors = validationError.errors || {}
          res.status(422).json({
            errors: validationErrors,
          })
          break

        case 'ParamValidationError':
          paramValidationError = error as ParamValidationError
          try {
            errorsJson = JSON.parse(paramValidationError.message) as Record<string, string>
          } catch (err) {
            // noop
          }

          res.status(400).json({
            errors: errorsJson,
          })
          break

        case 'UnprocessableEntity':
          res.status(422).json((err as HttpError).data)
          break

        case 'InternalServerError':
        default:
          // by default, ts-node will mask these errors for no good reason, causing us
          // to have to apply an ugly and annoying try-catch pattern to our controllers
          // and manually console log the error to determine what the actual error was.
          // this block enables us to not have to do that anymore.
          if (testEnv() && process.env.PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR !== '1') {
            console.log('ATTENTION: a server error was detected:')
            console.error(err)
          }

          if (this.config.specialHooks.serverError.length) {
            try {
              for (const hook of this.config.specialHooks.serverError) {
                await hook(err, req, res)
              }
            } catch (error) {
              if (developmentOrTestEnv()) {
                // In development and test, we want to throw so that, for example, double-setting of
                // status headers throws an error in specs. We couldn't figure out how to write
                // a spec for ensuring that such errors made it through because Supertest would
                // respond with the first header sent, which was successful, and the exception only
                // happened when Jest ended the spec.
                throw error
              } else {
                console.error(
                  `
                  Something went wrong while attempting to call your custom server_error hooks.
                  Psychic will rescue errors thrown here to prevent the server from crashing.
                  The error thrown is:
                `,
                )
                console.error(error)
              }
            }
          } else throw err
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
    } = {},
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
