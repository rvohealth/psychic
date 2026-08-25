import { camelize } from '@rvoh/dream/utils'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import confirmOverwrite from '../../cli/helpers/confirmOverwrite.js'
import psychicPath from '../../helpers/path/psychicPath.js'

/**
 * Generates the sync-enums initializer, which hooks `cli:sync` to write the
 * client enums file for the selected OpenAPI spec on every `pnpm psy sync`.
 *
 * When `openapiName` is provided, the generated initializer bakes it into
 * the `PsychicBin.syncClientEnums` call alongside the outfile; when omitted,
 * the generated call takes the source-compatible one-argument shape, which
 * syncs the `'default'` spec.
 *
 * Re-run behavior when the initializer file already exists:
 * - byte-identical to what would be generated → silent no-op
 * - different content → confirm-then-overwrite (an unanswerable prompt —
 *   no TTY, bypassed, or empty answer — fails loudly rather than silently
 *   skipping or overwriting)
 */
export default async function generateSyncEnumsInitializer(
  outfile: string,
  initializerFilename: string = 'sync-enums.ts',
  openapiName?: string,
  {
    confirm = confirmOverwrite,
  }: {
    confirm?: (filePaths: string[]) => Promise<boolean>
  } = {},
) {
  const initializerFilenameWithoutExtension = initializerFilename.replace(/\.ts$/, '')
  const camelized = camelize(initializerFilenameWithoutExtension)

  const destDir = path.join(psychicPath('conf'), 'initializers')
  const initializerPath = path.join(destDir, `${initializerFilenameWithoutExtension}.ts`)

  const syncClientEnumsArgs = openapiName === undefined ? `'${outfile}'` : `'${outfile}', '${openapiName}'`

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import { PsychicBin } from "@rvoh/psychic/system"
import AppEnv from '../AppEnv.js'

export default function ${camelized}(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(\`[${camelized}] syncing enums to ${outfile}...\`, async () => {
        await PsychicBin.syncClientEnums(${syncClientEnumsArgs})
      })
    }
  })
}\
`

  let existingContents: string | undefined
  try {
    existingContents = (await fs.readFile(initializerPath)).toString()
  } catch (error) {
    // only a missing file (ENOENT) means "create it": any other read
    // failure (EACCES, EISDIR, I/O errors) must not be treated as missing,
    // or an existing — possibly user-customized — file would be
    // overwritten without confirmation
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }

  if (existingContents !== undefined) {
    if (existingContents === contents) return // byte-identical re-run: silent no-op

    const confirmed = await confirm([initializerPath])
    if (!confirmed) {
      console.log(`Declined overwrite of ${initializerPath}; leaving the existing file untouched.`)
      return
    }
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  await fs.writeFile(initializerPath, contents)
}
