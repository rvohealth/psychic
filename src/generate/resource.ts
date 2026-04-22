import { DreamApp } from '@rvoh/dream'
import { DreamCLI } from '@rvoh/dream/system'
import pluralize from 'pluralize-esm'
import generateController from './controller.js'
import addResourceToRoutes from './helpers/addResourceToRoutes.js'
import { ParamExtractionStrategy } from './helpers/generateControllerContent.js'

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
    tableName?: string
    modelName?: string
    softDelete: boolean
    withExtractParams?: boolean
    withExtractImplicitParams?: boolean
  }
  columnsWithTypes: string[]
}) {
  // sanitize route here, making sure that the leading
  // slash is not passed through to subsequent helpers,
  // which will exhibit bad behavior when provided with
  // a prefixing slash.
  route = route.replace(/^\/+/, '')
  if (!options.singular) route = pluralize(route)

  const fullyQualifiedControllerName = DreamApp.system.standardizeFullyQualifiedModelName(route)
  const resourcefulActions = options.singular ? [...SINGULAR_RESOURCE_ACTIONS] : [...RESOURCE_ACTIONS]
  const onlyActions = options.only?.split(',')

  const forAdmin = /^Admin\//.test(fullyQualifiedControllerName)
  const forInternal = /^Internal\//.test(fullyQualifiedControllerName)

  await DreamCLI.generateDream({
    fullyQualifiedModelName,
    columnsWithTypes,
    options: {
      serializer: true,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: forAdmin,
      includeInternalSerializers: forInternal,
      connectionName: options.connectionName,
      tableName: options.tableName,
      modelName: options.modelName,
      softDelete: options.softDelete,
    },
  })

  if (options.withExtractParams && options.withExtractImplicitParams) {
    throw new Error(
      '--with-extract-params and --with-extract-implicit-params are mutually exclusive; pass only one.',
    )
  }
  const paramExtractionStrategy: ParamExtractionStrategy | undefined = options.withExtractParams
    ? 'explicit'
    : options.withExtractImplicitParams
      ? 'implicit'
      : undefined

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
    paramExtractionStrategy,
  })

  await addResourceToRoutes(route, {
    singular: options.singular,
    onlyActions,
  })
}
