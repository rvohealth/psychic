import * as fs from 'fs/promises'
import path from 'path'
import pluralize from 'pluralize'
import dreamjsOrDreamtsCmd from '../helpers/cli/dreamjsOrDreamtsCmd'
import sspawn from '../helpers/sspawn'
import PsychicApplication from '../psychic-application'
import generateClientAPIModule from './client/apiModule'
import generateController from './controller'
import omitCoreArg from '../helpers/cli/omitCoreArg'

export default async function generateResource(
  route: string,
  fullyQualifiedModelName: string,
  args: string[],
) {
  const psychicApp = PsychicApplication.getOrFail()

  const attributesWithTypes = args.filter(attr => !/^--/.test(attr))

  await sspawn(
    dreamjsOrDreamtsCmd(
      `g:model ${fullyQualifiedModelName} ${attributesWithTypes.join(' ')}`,
      omitCoreArg(args),
    ),
  )

  if (args.includes('--core')) {
    console.log('--core argument provided, setting now')
    process.env.PSYCHIC_CORE_DEVELOPMENT = '1'
  }

  await generateController(route, fullyQualifiedModelName, ['create', 'index', 'show', 'update', 'destroy'])

  if (!psychicApp?.apiOnly) {
    const psychicApp = PsychicApplication.getOrFail()
    const str = generateClientAPIModule(route, fullyQualifiedModelName)
    const filepath = path.join(
      psychicApp.clientRoot,
      psychicApp.client.apiPath,
      psychicApp.openapi.clientOutputFilename,
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
