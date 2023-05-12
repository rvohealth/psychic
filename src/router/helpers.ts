import { pascalize, compact } from 'dream'
import PsychicRouter, { PsychicNestedRouter } from '../router'
import { ResourceMethodType } from './types'

export function routePath(routePath: string) {
  return `/${routePath.replace(/^\//, '')}`
}

export function resourcePath(routePath: string) {
  return `/${routePath}/:id`
}

export function sanitizedControllerPath(controllerName: string) {
  return controllerName + 'Controller'
}

export function namespacedRoute(namespace: string, route: string) {
  return (
    '/' +
    compact([namespace || null, route])
      .join('/')
      .replace(/^\//, '')
  )
}

export function namespacedControllerActionString(namespace: string, controllerActionString: string) {
  return [
    namespace
      .split('/')
      .filter(part => !/^:/.test(part))
      .map(part => pascalize(part))
      .join('/'),
    controllerActionString,
  ]
    .join('/')
    .replace(/^\//, '')
}

export function applyResourcesAction(
  path: string,
  action: ResourceMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter
) {
  switch (action) {
    case 'index':
      routingMechanism.get(path, `${pascalize(path)}#index`)
      break

    case 'create':
      routingMechanism.post(path, `${pascalize(path)}#create`)
      break

    case 'update':
      routingMechanism.put(`${path}/:id`, `${pascalize(path)}#update`)
      routingMechanism.patch(`${path}/:id`, `${pascalize(path)}#update`)
      break

    case 'show':
      routingMechanism.get(`${path}/:id`, `${pascalize(path)}#show`)
      break

    case 'delete':
      routingMechanism.delete(`${path}/:id`, `${pascalize(path)}#destroy`)
      break
    default:
      throw `unknown action: ${action}`
  }
}

export function applyResourceAction(
  path: string,
  action: ResourceMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter
) {
  switch (action) {
    case 'update':
      routingMechanism.put(path, `${pascalize(path)}#update`)
      break

    case 'show':
      routingMechanism.get(path, `${pascalize(path)}#show`)
      break

    case 'delete':
      routingMechanism.delete(path, `${pascalize(path)}#destroy`)
      break

    default:
      throw `unsupported resource method type: ${action}`
  }
}
