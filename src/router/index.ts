import {
  CheckConstraintViolation,
  DataTypeColumnTypeMismatch,
  NotNullViolation,
  RecordNotFound,
  ValidationError,
} from '@rvoh/dream'
import { Express, Request, RequestHandler, Response, Router } from 'express'
import PsychicController from '../controller/index.js'
import ParamValidationError from '../error/controller/ParamValidationError.js'
import ParamValidationErrors from '../error/controller/ParamValidationErrors.js'
import HttpError from '../error/http/index.js'
import OpenapiRequestValidationFailure from '../error/openapi/OpenapiRequestValidationFailure.js'
import EnvInternal from '../helpers/EnvInternal.js'
import errorIsRescuableHttpError from '../helpers/error/errorIsRescuableHttpError.js'
import PsychicApp from '../psychic-app/index.js'
import { NamespaceConfig, PsychicControllerActions, routePath } from '../router/helpers.js'
import PsychicRouteComputer, { PsychicNestedRouteComputer } from './route-computer.js'
import { ControllerActionRouteConfig, MiddlewareRouteConfig } from './route-manager.js'
import { HttpMethod, ResourcesOptions } from './types.js'

export default class PsychicRouter {
  public app: Express
  public config: PsychicApp
  public currentNamespaces: NamespaceConfig[] = []
  private routeComputer: PsychicRouteComputer
  constructor(app: Express, config: PsychicApp) {
    this.app = app
    this.config = config
    this.routeComputer = new PsychicRouteComputer(config)
  }

  public get routingMechanism(): Express | Router {
    return this.app
  }

  public get routes() {
    return this.routeComputer.routes
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.get(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.post(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.put(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.patch(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.delete(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.routeComputer.options(path, controller as any, action as string)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    this.routeComputer.crud(httpMethod, path, controllerOrMiddleware as any, action as string)
  }

  public namespace(namespace: string, cb: (router: PsychicNestedRouteComputer) => void) {
    this.routeComputer.namespace(namespace, cb)
  }

  public scope(scope: string, cb: (router: PsychicNestedRouteComputer) => void) {
    this.routeComputer.scope(scope, cb)
  }

  public resources(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouteComputer) => void),
    cb?: (router: PsychicNestedRouteComputer) => void,
  ) {
    this.routeComputer['makeResource'](path, optionsOrCb, cb, true)
  }

  public resource(
    path: string,
    optionsOrCb?: ResourcesOptions | ((router: PsychicNestedRouteComputer) => void),
    cb?: (router: PsychicNestedRouteComputer) => void,
  ) {
    this.routeComputer['makeResource'](path, optionsOrCb, cb, false)
  }

  public collection(cb: (router: PsychicNestedRouteComputer) => void) {
    this.routeComputer.collection(cb)
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
      } else if (err instanceof NotNullViolation || err instanceof CheckConstraintViolation) {
        res.status(422).json()
      } else if (err instanceof DataTypeColumnTypeMismatch) {
        res.status(400).json()
      } else if (err instanceof ValidationError) {
        res.status(422).json({ type: 'validator', errors: err.errors || {} })
      } else if (err instanceof OpenapiRequestValidationFailure) {
        res.status(400).json({
          type: 'openapi',
          target: err.target,
          errors: err.errors,
        })
      } else if (err instanceof ParamValidationError) {
        res.status(400).json({
          type: 'validator',
          errors: {
            [err.paramName]: err.errorMessages,
          },
        })
      } else if (err instanceof ParamValidationErrors) {
        res.status(400).json({
          type: 'validator',
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
