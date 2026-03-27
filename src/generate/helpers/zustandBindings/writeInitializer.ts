import { camelize, pascalize } from '@rvoh/dream/utils'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PackageManager from '../../../cli/helpers/PackageManager.js'
import psychicPath from '../../../helpers/path/psychicPath.js'

export default async function writeInitializer({
  exportName,
  schemaFile,
  outputDir,
}: {
  exportName: string
  schemaFile: string
  outputDir: string
}) {
  const pascalized = pascalize(exportName)
  const camelized = camelize(exportName)
  const execCmd = PackageManager.exec(`@hey-api/openapi-ts -i ${schemaFile} -o ${outputDir}`)

  const destDir = path.join(psychicPath('conf'), 'initializers', 'openapi')
  const initializerFilename = `${camelized}.ts`
  const initializerPath = path.join(destDir, initializerFilename)

  try {
    await fs.access(initializerPath)
    return // early return if the file already exists
  } catch {
    // noop
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initialize${pascalized}(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[${camelized}] syncing...\`, async () => {
        await DreamCLI.spawn('${execCmd}', {
          onStdout: message => {
            DreamCLI.logger.logContinueProgress(\`[${camelized}]\` + ' ' + message, {
              logPrefixColor: 'green',
            })
          },
        })
      })
    }
  })
}\
`

  await fs.writeFile(initializerPath, contents)
}
