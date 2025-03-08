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
}

export interface RouteConfig {
  controller: typeof PsychicController
  action: string
  path: string
  httpMethod: HttpMethod
}
