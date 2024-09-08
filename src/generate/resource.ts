import { generateDream } from '@rvohealth/dream'
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

  await generateController({
    fullyQualifiedControllerName: pluralize(fullyQualifiedModelName),
    fullyQualifiedModelName,
    actions: ['create', 'index', 'show', 'update', 'destroy'],
  })

  await addResourceToRoutes(pluralize(route))
}
