import { camelize, pascalize } from '@rvoh/dream/utils'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import psychicPath from '../../../helpers/path/psychicPath.js'

export default async function writeInitializer({ exportName }: { exportName: string }) {
  const pascalized = pascalize(exportName)
  const camelized = camelize(exportName)

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

  const filePath = path.join('.', 'src', 'conf', 'openapi', `${camelized}.openapi-codegen.json`)

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../../AppEnv.js'

export default function initialize${pascalized}(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[${camelized}] syncing...\`)
      await DreamCLI.spawn('npx @rtk-query/codegen-openapi ${filePath}', {
        onStdout: message => {
          DreamCLI.logger.logContinueProgress(\`[${camelized}]\` + ' ' + message, {
            logPrefixColor: 'green',
          })
        },
      })
      DreamCLI.logger.logEndProgress()
    }
  })
}\
`

  await fs.writeFile(initializerPath, contents)
}
