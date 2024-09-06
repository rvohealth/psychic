import { compact, pascalize } from '@rvohealth/dream'
import PsychicRouter, { PsychicNestedRouter } from '../router'
import { ResourcesMethodType, ResourcesOptions } from './types'
import PsychicController from '../controller'
import PsychicApplication from '../psychic-application'

export function routePath(routePath: string) {
  return `/${routePath.replace(/^\//, '')}`
}

export function resourcePath(routePath: string) {
  return `/${routePath}/:id`
}

export function sanitizedControllerPath(controllerName: string) {
  return controllerName.replace(/Controller$/, '') + 'Controller'
}

export function controllerGlobalNameFromControllerPath(controllerName: string) {
  return `controllers/${sanitizedControllerPath(controllerName)}`
}

export function namespacedRoute(namespace: string, route: string) {
  const compactedRoutes = compact([namespace || null, route])
  return '/' + compactedRoutes.join('/').replace(/^\//, '')
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

export function lookupControllerOrFail(namespaces: NamespaceConfig[]): typeof PsychicController {
  const filteredNamespaces = namespaces.filter(n => !n.isScope)
  if (!filteredNamespaces.length) throw new Error('no valid namespaces')
  const filename = filteredNamespaces.map(str => pascalize(str.namespace)).join('/') + 'Controller'
  const psychicApp = PsychicApplication.getOrFail()
  const controller = psychicApp.controllers[`controllers/${filename}`]
  if (!controller) throw new Error('Psychic controller not found')
  return controller
}

export type FunctionProperties<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]: T[K]
}
export type FunctionPropertyNames<T> = keyof FunctionProperties<T>
export type PsychicControllerActions<T extends typeof PsychicController> = Exclude<
  FunctionPropertyNames<Required<InstanceType<T>>>,
  FunctionPropertyNames<PsychicController>
>

export interface NamespaceConfig {
  namespace: string
  resourceful: boolean
  isScope: boolean
}

export function applyResourcesAction(
  path: string,
  action: ResourcesMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter,
  options?: ResourcesOptions,
) {
  const namespaces = routingMechanism.currentNamespaces.concat({
    namespace: path,
    resourceful: false,
    isScope: false,
  })
  const controller = options?.controller || lookupControllerOrFail(namespaces)
  switch (action) {
    case 'index':
      routingMechanism.get(path, controller, 'index' as PsychicControllerActions<typeof controller>)
      break

    case 'create':
      routingMechanism.post(path, controller, 'create' as PsychicControllerActions<typeof controller>)
      break

    case 'update':
      routingMechanism.put(`${path}/:id`, controller, 'update' as PsychicControllerActions<typeof controller>)
      routingMechanism.patch(
        `${path}/:id`,
        controller,
        'update' as PsychicControllerActions<typeof controller>,
      )
      break

    case 'show':
      routingMechanism.get(`${path}/:id`, controller, 'show' as PsychicControllerActions<typeof controller>)
      break

    case 'destroy':
      routingMechanism.delete(
        `${path}/:id`,
        controller,
        'destroy' as PsychicControllerActions<typeof controller>,
      )
      break
  }
}

export function applyResourceAction(
  path: string,
  action: ResourcesMethodType,
  routingMechanism: PsychicRouter | PsychicNestedRouter,
  options?: ResourcesOptions,
) {
  const namespaces = routingMechanism.currentNamespaces.concat({
    namespace: path,
    resourceful: false,
    isScope: false,
  })
  const controller = options?.controller || lookupControllerOrFail(namespaces)
  switch (action) {
    case 'create':
      routingMechanism.post(path, controller, 'create' as PsychicControllerActions<typeof controller>)
      break

    case 'update':
      routingMechanism.put(`${path}/:id`, controller, 'update' as PsychicControllerActions<typeof controller>)
      routingMechanism.patch(
        `${path}/:id`,
        controller,
        'update' as PsychicControllerActions<typeof controller>,
      )
      break

    case 'show':
      routingMechanism.get(`${path}/:id`, controller, 'show' as PsychicControllerActions<typeof controller>)
      break

    case 'destroy':
      routingMechanism.delete(
        `${path}/:id`,
        controller,
        'destroy' as PsychicControllerActions<typeof controller>,
      )
      break

    default:
      throw new Error(`unsupported resource method type: ${action}`)
  }
}
