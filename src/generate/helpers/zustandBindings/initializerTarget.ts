import { camelize, pascalize } from '@rvoh/dream/utils'
import * as path from 'node:path'
import { FileWriteTarget } from '../../../cli/helpers/applyConfirmedWriteSet.js'
import PackageManager from '../../../cli/helpers/PackageManager.js'
import psychicPath from '../../../helpers/path/psychicPath.js'

/**
 * Computes the psychic initializer write target, which taps into the sync
 * hooks to automatically run the @hey-api/openapi-ts CLI util and generate a
 * zustand store from the SDK output.
 */
export default function initializerTarget({
  exportName,
  schemaFile,
  outputDir,
}: {
  exportName: string
  schemaFile: string
  outputDir: string
}): FileWriteTarget {
  const pascalized = pascalize(exportName)
  const camelized = camelize(exportName)
  const { command, args } = PackageManager.exec('openapi-ts', ['-i', schemaFile, '-o', outputDir])

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
        await DreamCLI.spawn('${command}', {
          args: ${JSON.stringify(args)},
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

  return { filePath: initializerPath, contents }
}
