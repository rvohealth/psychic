import { camelize, compact, pascalize } from '@rvoh/dream'
import PsychicController from '../controller/index.js.js'
import CannotFindInferredControllerFromProvidedNamespace from '../error/router/cannot-find-inferred-controller-from-provided-namespace.js.js'
import CannotInferControllerFromTopLevelRouteError from '../error/router/cannot-infer-controller-from-top-level-route.js.js'
import pascalizeFileName from '../helpers/pascalizeFileName.js.js'
import { FunctionPropertyNames } from '../helpers/typeHelpers.js.js'
import PsychicApplication from '../psychic-application/index.js.js'
import PsychicRouter, { PsychicNestedRouter } from '../router/index.js.js'
import { HttpMethod, ResourcesMethodType, ResourcesOptions } from './types.js.js'

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
    lookupControllerOrFail(routingMechanism, {
      path: action,
      httpMethod: httpMethodFromResourcefulAction(action),
      resourceName: path,
    })

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
    lookupControllerOrFail(routingMechanism, {
      path: action,
      httpMethod: httpMethodFromResourcefulAction(action),
      resourceName: path,
    })

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

function httpMethodFromResourcefulAction(action: ResourcesMethodType): HttpMethod {
  switch (action) {
    case 'index':
      return 'get'
    case 'show':
      return 'get'
    case 'create':
      return 'post'
    case 'update':
      return 'patch'
    case 'destroy':
      return 'delete'
    default:
      throw new Error(`unexpected resourceful action: ${action as string}`)
  }
}
