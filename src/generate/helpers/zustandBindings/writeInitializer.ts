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
  const execCmd = PackageManager.exec(`openapi-ts -i ${schemaFile} -o ${outputDir}`)

  const destDir = path.join(psychicPath('conf'), 'initializers', 'openapi')
  const initializerFilename = `${camelized}.ts`
  const initializerPath = path.join(destDir, initializerFilename)

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
import { generateZustandStoreFromSdk } from '@rvoh/psychic/system'
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

      await DreamCLI.logger.logProgress(\`[${camelized}] generating zustand store...\`, async () => {
        await generateZustandStoreFromSdk('${outputDir}')
      })
    }
  })
}\
`

  try {
    const existingContents = (await fs.readFile(initializerPath)).toString()
    if (existingContents === contents) {
      return // early return if the file already matches exactly
    }
  } catch {
    // noop — file doesn't exist yet
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  await fs.writeFile(initializerPath, contents)
}
