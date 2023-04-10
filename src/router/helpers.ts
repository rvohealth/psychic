import HowlRouter, { HowlNestedRouter } from '../router'
import { ResourceMethodType } from './types'

export function routePath(routePath: string) {
  return `/${routePath.replace(/^\//, '')}`
}

export function resourcePath(routePath: string) {
  return `/${routePath}/:id`
}

export function applyResourcesAction(
  path: string,
  action: ResourceMethodType,
  routingMechanism: HowlRouter | HowlNestedRouter
) {
  switch (action) {
    case 'index':
      routingMechanism.get(path, `${path}#index`)
      break

    case 'create':
      routingMechanism.post(path, `${path}#create`)
      break

    case 'update':
      routingMechanism.put(`${path}/:id`, `${path}#update`)
      routingMechanism.patch(`${path}/:id`, `${path}#update`)
      break

    case 'show':
      routingMechanism.get(`${path}/:id`, `${path}#show`)
      break

    case 'delete':
      routingMechanism.delete(`${path}/:id`, `${path}#destroy`)
      break
    default:
      throw `unknown action: ${action}`
  }
}

export function applyResourceAction(
  path: string,
  action: ResourceMethodType,
  routingMechanism: HowlRouter | HowlNestedRouter
) {
  switch (action) {
    case 'update':
      routingMechanism.put(path, `${path}#update`)
      routingMechanism.patch(path, `${path}#update`)
      break

    case 'show':
      routingMechanism.get(path, `${path}#show`)
      break

    case 'delete':
      routingMechanism.delete(path, `${path}#delete`)
      break

    default:
      throw `unsupported resource method type: ${action}`
  }
}
