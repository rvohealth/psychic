import { camelize, compact, pascalize } from '@rvohealth/dream'
import PsychicController from '../controller'
import CannotInferControllerFromTopLevelRouteError from '../error/router/cannot-infer-controller-from-top-level-route'
import PsychicApplication from '../psychic-application'
import PsychicRouter, { PsychicNestedRouter } from '../router'
import { ResourcesMethodType, ResourcesOptions } from './types'
import CannotFindInferredControllerFromProvidedNamespace from '../error/router/cannot-find-inferred-controller-from-provided-namespace'
import pascalizeFileName from '../helpers/pascalizeFileName'

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

type RoutingMechanism = PsychicRouter | PsychicNestedRouter

type LookupOpts = {
  resourceName?: string
  httpMethod: string
  path: string
}

export function lookupControllerOrFail(
  routingMechanism: RoutingMechanism,
  opts: LookupOpts,
): typeof PsychicController {
  const namespaces = opts.resourceName
    ? routingMechanism.currentNamespaces.concat({
        namespace: opts.resourceName,
        resourceful: false,
        isScope: false,
      })
    : routingMechanism.currentNamespaces

  const filteredNamespaces = namespaces.filter(n => !n.isScope)
  if (!filteredNamespaces.length)
    throw new CannotInferControllerFromTopLevelRouteError(
      opts.httpMethod,
      opts.path,
      pascalizeFileName(opts.path) + 'Controller',
      camelize(pascalizeFileName(opts.path)),
    )

  return inferControllerOrFail(filteredNamespaces, opts)
}

function inferControllerOrFail(
  filteredNamespaces: NamespaceConfig[],
  opts: LookupOpts,
): typeof PsychicController {
  const filename = filteredNamespaces.map(str => pascalize(str.namespace)).join('/') + 'Controller'
  const expectedPath = `controllers/${filename}`

  const controller = PsychicApplication.getOrFail().controllers[expectedPath]
  if (!controller)
    throw new CannotFindInferredControllerFromProvidedNamespace({
      expectedPath,
      controllerName: filename.replace(/\//g, ''),
      action: camelize(pascalizeFileName(opts.path)),
      httpMethod: opts.httpMethod,
      path: opts.path,
    })

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
  routingMechanism: RoutingMechanism,
  options?: ResourcesOptions,
) {
  const controller =
    options?.controller ||
    lookupControllerOrFail(routingMechanism, { path, httpMethod: 'get', resourceName: path })

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
  const controller =
    options?.controller ||
    lookupControllerOrFail(routingMechanism, { path, httpMethod: 'get', resourceName: path })

  switch (action) {
    case 'create':
      routingMechanism.post(path, controller, 'create' as PsychicControllerActions<typeof controller>)
      break

    case 'update':
      routingMechanism.put(path, controller, 'update' as PsychicControllerActions<typeof controller>)
      routingMechanism.patch(path, controller, 'update' as PsychicControllerActions<typeof controller>)
      break

    case 'show':
      routingMechanism.get(path, controller, 'show' as PsychicControllerActions<typeof controller>)
      break

    case 'destroy':
      routingMechanism.delete(path, controller, 'destroy' as PsychicControllerActions<typeof controller>)
      break

    default:
      throw new Error(`unsupported resource method type: ${action}`)
  }
}
