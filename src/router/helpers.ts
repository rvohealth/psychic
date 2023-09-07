import { pascalize, compact } from 'dream'
import PsychicRouter, { PsychicNestedRouter } from '../router'
import { ResourcesMethodType, ResourcesOptions } from './types'
import { RouterOptions } from 'express'

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
  action: ResourcesMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter,
  options?: ResourcesOptions
) {
  const controllerName = options?.controller || pascalize(path)
  switch (action) {
    case 'index':
      routingMechanism.get(path, `${controllerName}#index`)
      break

    case 'create':
      routingMechanism.post(path, `${controllerName}#create`)
      break

    case 'update':
      routingMechanism.put(`${path}/:id`, `${controllerName}#update`)
      routingMechanism.patch(`${path}/:id`, `${controllerName}#update`)
      break

    case 'show':
      routingMechanism.get(`${path}/:id`, `${controllerName}#show`)
      break

    case 'delete':
      routingMechanism.delete(`${path}/:id`, `${controllerName}#destroy`)
      break
    default:
      throw `unknown action: ${action}`
  }
}

export function applyResourceAction(
  path: string,
  action: ResourcesMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter,
  options?: ResourcesOptions
) {
  const controllerName = options?.controller || pascalize(path)
  switch (action) {
    case 'update':
      routingMechanism.put(path, `${controllerName}#update`)
      routingMechanism.patch(path, `${controllerName}#update`)
      break

    case 'show':
      routingMechanism.get(path, `${controllerName}#show`)
      break

    case 'delete':
      routingMechanism.delete(path, `${controllerName}#destroy`)
      break

    default:
      throw `unsupported resource method type: ${action}`
  }
}
