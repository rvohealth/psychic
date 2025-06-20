import { generateDream, standardizeFullyQualifiedModelName } from '@rvoh/dream'
import pluralize from 'pluralize-esm'
import generateController from './controller.js'
import addResourceToRoutes from './helpers/addResourceToRoutes.js'

export default async function generateResource({
  route,
  fullyQualifiedModelName,
  options,
  columnsWithTypes,
}: {
  route: string
  fullyQualifiedModelName: string
  options: { stiBaseSerializer: boolean; owningModel?: string }
  columnsWithTypes: string[]
}) {
  const fullyQualifiedControllerName = standardizeFullyQualifiedModelName(route)

  const forAdmin = /^Admin\//.test(fullyQualifiedControllerName)

  await generateDream({
    fullyQualifiedModelName,
    columnsWithTypes,
    options: {
      serializer: true,
      stiBaseSerializer: options.stiBaseSerializer,
      includeAdminSerializers: forAdmin,
    },
  })

  route = pluralize(route)

  await generateController({
    fullyQualifiedControllerName,
    fullyQualifiedModelName,
    actions: ['create', 'index', 'show', 'update', 'destroy'],
    columnsWithTypes,
    resourceSpecs: true,
    owningModel: options.owningModel,
  })

  await addResourceToRoutes(route)
}
