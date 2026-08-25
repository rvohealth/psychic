import { hyphenize } from '@rvoh/dream/utils'
import * as path from 'node:path'
import applyConfirmedWriteSet, { ConfirmOverwriteFn } from '../../../cli/helpers/applyConfirmedWriteSet.js'
import PackageManager from '../../../cli/helpers/PackageManager.js'
import psychicPath from '../../../helpers/path/psychicPath.js'

/**
 * Generates the sync-openapi-typescript initializer, which hooks `cli:sync`
 * to run openapi-typescript against the given openapi file on every
 * `pnpm psy sync`.
 *
 * Re-run behavior when the initializer file already exists:
 * - byte-identical to what would be generated → silent no-op
 * - different content → confirm-then-overwrite (an unanswerable prompt —
 *   no TTY, bypassed, or empty answer — fails loudly rather than silently
 *   overwriting, which was the previous behavior)
 */
export default async function generateInitializer(
  openapiFilepath: string,
  outfile: string,
  initializerFilename: string,
  {
    confirm,
  }: {
    confirm?: ConfirmOverwriteFn
  } = {},
) {
  if (!/\.d\.ts$/.test(outfile)) throw new Error(`outfile must have extension .d.ts`)

  const initializerFilenameWithoutExtension = initializerFilename.replace(/\.ts$/, '')
  const hyphenized = hyphenize(initializerFilenameWithoutExtension)

  const destDir = path.join(psychicPath('conf'), 'initializers')
  const initializerPath = path.join(destDir, `${initializerFilenameWithoutExtension}.ts`)

  const { command, args } = PackageManager.exec('openapi-typescript', [openapiFilepath, '-o', outfile])

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import AppEnv from '../AppEnv.js'

export default (psy: PsychicApp) => {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[${hyphenized}] extracting types from ${openapiFilepath} to ${outfile}...\`, async () => {
        await DreamCLI.spawn('${command}', { args: ${JSON.stringify(args)} })
      })
    }
  })
}\
`

  await applyConfirmedWriteSet([{ filePath: initializerPath, contents }], { confirm })
}
