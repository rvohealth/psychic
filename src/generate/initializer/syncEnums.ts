import { camelize } from '@rvoh/dream'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import PackageManager from '../../cli/helpers/PackageManager.js'
import psychicPath from '../../helpers/path/psychicPath.js'

export default async function generateSyncEnumsInitializer(
  outfile: string,
  initializerFilename: string = 'sync-enums.ts',
) {
  const initializerFilenameWithoutExtension = initializerFilename.replace(/\.ts$/, '')
  const camelized = camelize(initializerFilenameWithoutExtension)

  const destDir = path.join(psychicPath('conf'), 'initializers')
  const initializerPath = path.join(destDir, `${initializerFilenameWithoutExtension}.ts`)

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
import { DreamCLI } from '@rvoh/dream'
import { PsychicApp } from '@rvoh/psychic'
import AppEnv from '../AppEnv.js'

export default function ${camelized}(psy: PsychicApp) {
  psy.on('sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      DreamCLI.logger.logStartProgress(\`[${camelized}] syncing enums to ${outfile}...\`)
      await DreamCLI.spawn('${PackageManager.run(`psy sync:client:enums ${outfile}`)}', {
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
