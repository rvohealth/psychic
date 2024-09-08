import { generateDream } from '@rvohealth/dream'
import * as fs from 'fs/promises'
import path from 'path'
import pluralize from 'pluralize'
import PsychicApplication from '../psychic-application'
import generateClientAPIModule from './client/apiModule'
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
  const psychicApp = PsychicApplication.getOrFail()

  await generateDream({ fullyQualifiedModelName, columnsWithTypes, options: { serializer: true } })

  await generateController({
    fullyQualifiedControllerName: pluralize(fullyQualifiedModelName),
    fullyQualifiedModelName,
    actions: ['create', 'index', 'show', 'update', 'destroy'],
  })

  await addResourceToRoutes(pluralize(route))

  if (!psychicApp?.apiOnly) {
    const psychicApp = PsychicApplication.getOrFail()
    const str = generateClientAPIModule(route, fullyQualifiedModelName)
    const filepath = path.join(
      psychicApp.clientRoot,
      psychicApp.client.apiPath,
      pluralize(fullyQualifiedModelName.toLowerCase()) + '.ts',
    )

    const pathParts = filepath.split('/')
    pathParts.pop()

    await fs.mkdir(pathParts.join('/'), { recursive: true })
    await fs.writeFile(filepath, str)
    console.log(`generating client api module: ${filepath}`)
  }
  // if (process.env.NODE_ENV !== 'test') process.exit()
}
