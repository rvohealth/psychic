import { camelize, pascalize } from '@rvoh/dream/utils'
import * as path from 'node:path'
import { FileWriteTarget } from '../../../cli/helpers/applyConfirmedWriteSet.js'
import PackageManager from '../../../cli/helpers/PackageManager.js'
import psychicPath from '../../../helpers/path/psychicPath.js'

/**
 * Computes the psychic initializer write target, which taps into the sync
 * hooks to automatically run the @rtk-query/codegen-openapi CLI util.
 */
export default function initializerTarget({ exportName }: { exportName: string }): FileWriteTarget {
  const pascalized = pascalize(exportName)
  const camelized = camelize(exportName)

  const destDir = path.join(psychicPath('conf'), 'initializers', 'openapi')
  const initializerFilename = `${camelized}.ts`
  const initializerPath = path.join(destDir, initializerFilename)

  const filePath = path.join('.', 'src', 'conf', 'openapi', `${camelized}.openapi-codegen.json`)
  const { command, args } = PackageManager.exec('rtk-query-codegen-openapi', [filePath])

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from '@rvoh/psychic'
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
    }
  })
}\
`

  return { filePath: initializerPath, contents }
}
