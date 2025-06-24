import { RequestHandler } from 'express'
import PsychicController from '../controller/index.js'
import { HttpMethod } from './types.js'

export default class RouteManager {
  public routes: RouteConfig[] = []

  public addRoute({
    httpMethod,
    path,
    controller,
    action,
  }: {
    httpMethod: HttpMethod
    path: string
    controller: typeof PsychicController
    action: string
  }) {
    this.routes.push({
      httpMethod,
      path,
      controller,
      action,
    })
  }

  public addMiddleware({
    httpMethod,
    path,
    middleware,
  }: {
    httpMethod: HttpMethod
    path: string
    middleware: RequestHandler
  }) {
    this.routes.push({
      httpMethod,
      path,
      middleware,
    })
  }
}

export type RouteConfig = ControllerActionRouteConfig | MiddlewareRouteConfig

interface BaseRouteConfig {
  httpMethod: HttpMethod
  path: string
}

export type ControllerActionRouteConfig = BaseRouteConfig & {
  controller: typeof PsychicController
  action: string
}

export type MiddlewareRouteConfig = BaseRouteConfig & {
  middleware: RequestHandler
}
