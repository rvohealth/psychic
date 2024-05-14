import * as fs from 'fs/promises'
import generateController from './controller'
import sspawn from '../helpers/sspawn'
import dreamjsOrDreamtsCmd from '../../boot/cli/helpers/dreamjsOrDreamtsCmd'
import omitCoreArg from '../../boot/cli/helpers/omitCoreArg'
import { clientApiPath } from '../helpers/path'
import readAppConfig from '../config/helpers/readAppConfig'
import generateClientAPIModule from './client/apiModule'
import pluralize from 'pluralize'

export default async function generateResource(
  route: string,
  fullyQualifiedModelName: string,
  args: string[],
) {
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

  const yamlConf = await readAppConfig()
  if (!yamlConf?.api_only) {
    const str = generateClientAPIModule(route, fullyQualifiedModelName)
    const filepath = (
      (await clientApiPath()) +
      '/' +
      pluralize(fullyQualifiedModelName) +
      '.ts'
    ).toLowerCase()

    const pathParts = filepath.split('/')
    pathParts.pop()

    await fs.mkdir(pathParts.join('/'), { recursive: true })
    await fs.writeFile(filepath, str)
    console.log(`generating client api module: ${filepath}`)
  }
  // if (process.env.NODE_ENV !== 'test') process.exit()
}
