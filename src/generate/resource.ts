import { generateDream, standardizeFullyQualifiedModelName } from '@rvohealth/dream'
import pluralize from 'pluralize'
import generateController from './controller'
import addResourceToRoutes from './helpers/addResourceToRoutes'

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
