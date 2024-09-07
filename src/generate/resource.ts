import { generateDream } from '@rvohealth/dream'
import generateController from './controller'

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
    route,
    fullyQualifiedModelName,
    actions: ['create', 'index', 'show', 'update', 'destroy'],
  })
}
