import { HttpMethod } from './types'

export default class RouteManager {
  public routes: RouteConfig[] = []

  public addRoute({
    httpMethod,
    path,
    controllerActionString,
  }: {
    httpMethod: HttpMethod
    path: string
    controllerActionString: string
  }) {
    this.routes.push({
      httpMethod,
      path,
      controllerActionString,
    })
  }
}

export interface RouteConfig {
  controllerActionString: string
  path: string
  httpMethod: HttpMethod
}
