import { generateDream, standardizeFullyQualifiedModelName } from '@rvoh/dream'
import pluralize from 'pluralize-esm'
import generateController from './controller.js'
import addResourceToRoutes from './helpers/addResourceToRoutes.js'

export default async function generateResource({
  route,
  fullyQualifiedModelName,
  columnsWithTypes,
}: {
  route: string
  fullyQualifiedModelName: string
  columnsWithTypes: string[]
}) {
  await generateDream({ fullyQualifiedModelName, columnsWithTypes, options: { serializer: true } })

  route = pluralize(route)

  await generateController({
    fullyQualifiedControllerName: standardizeFullyQualifiedModelName(route),
    fullyQualifiedModelName,
    actions: ['create', 'index', 'show', 'update', 'destroy'],
    columnsWithTypes,
    resourceSpecs: true,
  })

  await addResourceToRoutes(route)
}
