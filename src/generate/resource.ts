import { generateDream, standardizeFullyQualifiedModelName } from '@rvoh/dream/internal'
import pluralize from 'pluralize-esm'
import generateController from './controller.js'
import addResourceToRoutes from './helpers/addResourceToRoutes.js'

export const RESOURCE_ACTIONS = ['index', 'show', 'create', 'update', 'destroy'] as const
export const SINGULAR_RESOURCE_ACTIONS = ['show', 'create', 'update', 'destroy'] as const

export default async function generateResource({
  route,
  fullyQualifiedModelName,
  options,
  columnsWithTypes,
}: {
  route: string
  fullyQualifiedModelName: string
  options: {
    singular: boolean
    only?: string
    stiBaseSerializer: boolean
    owningModel?: string
    connectionName: string
  }
  columnsWithTypes: string[]
}) {
  // sanitize route here, making sure that the leading
  // slash is not passed through to subsequent helpers,
  // which will exhibit bad behavior when provided with
  // a prefixing slash.
  route = route.replace(/^\/+/, '')
  if (!options.singular) route = pluralize(route)

  const fullyQualifiedControllerName = standardizeFullyQualifiedModelName(route)
  const resourcefulActions = options.singular ? [...SINGULAR_RESOURCE_ACTIONS] : [...RESOURCE_ACTIONS]
  const onlyActions = options.only?.split(',')

  const forAdmin = /^Admin\//.test(fullyQualifiedControllerName)

  await generateDream({
    fullyQualifiedModelName,
    columnsWithTypes,
    options: {
      serializer: true,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: forAdmin,
      connectionName: options.connectionName,
    },
  })

  await generateController({
    fullyQualifiedControllerName,
    fullyQualifiedModelName,
    actions: onlyActions
      ? resourcefulActions.filter(action => onlyActions.includes(action))
      : resourcefulActions,
    columnsWithTypes,
    resourceSpecs: true,
    singular: options.singular,
    owningModel: options.owningModel,
  })

  await addResourceToRoutes(route, {
    singular: options.singular,
    onlyActions,
  })
}
