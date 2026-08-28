import { camelize, hyphenize } from '@rvoh/dream/utils'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import confirmOverwrite from '../../cli/helpers/confirmOverwrite.js'
import psychicPath from '../../helpers/path/psychicPath.js'

// prettier-ignore
const RESERVED_WORDS = new Set([
  'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
  'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
  'finally', 'for', 'function', 'if', 'implements', 'import', 'in',
  'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private',
  'protected', 'public', 'return', 'static', 'super', 'switch', 'this',
  'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
])

/**
 * The camelized initializer basename becomes the generated initializer's
 * function name — an identifier position, where JSON.stringify cannot help
 * and Dream's camelize preserves quotes, backticks, and dollar-braces
 * (`camelize("it's-enums") === "it'sEnums"`). Strip anything that is not a
 * valid identifier character, and fall back to `'syncEnums'` when nothing
 * identifier-safe remains, the result would start with a digit, or the
 * result is a reserved word — so no openapiName can produce a syntactically
 * broken generated file.
 */
function initializerFunctionName(camelized: string): string {
  const stripped = camelized.replace(/[^A-Za-z0-9_$]/g, '')
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(stripped) || RESERVED_WORDS.has(stripped)) return 'syncEnums'
  return stripped
}

/**
 * Generates the sync-enums initializer, which hooks `cli:sync` to write the
 * client enums file for the selected OpenAPI spec on every `pnpm psy sync`.
 *
 * The initializer filename is derived from the spec, the same way the
 * zustand/redux setup commands derive theirs from `--export-name`: the
 * `'default'` spec (or an omitted `openapiName`) generates
 * `sync-enums.ts`, and any other spec generates `sync-enums-<name>.ts`
 * (hyphenized) — so an app with one front end per OpenAPI spec runs this
 * setup once per spec and each run owns its own initializer.
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
  openapiName?: string,
  {
    confirm = confirmOverwrite,
    overwrite = false,
  }: {
    confirm?: (filePaths: string[]) => Promise<boolean>
    overwrite?: boolean
  } = {},
) {
  const initializerFilenameWithoutExtension =
    openapiName === undefined || openapiName === 'default'
      ? 'sync-enums'
      : `sync-enums-${hyphenize(openapiName)}`
  const functionName = initializerFunctionName(camelize(initializerFilenameWithoutExtension))

  const destDir = path.join(psychicPath('conf'), 'initializers')
  const initializerPath = path.join(destDir, `${initializerFilenameWithoutExtension}.ts`)

  // outfile and openapiName are embedded in generated source, so they are
  // emitted as JSON string literals (valid JS string literals) rather than
  // hand-built quoted strings: a quote, backslash, backtick, or dollar-brace in
  // either must round-trip instead of producing a syntactically broken or
  // misbehaving initializer
  const syncClientEnumsArgs =
    openapiName === undefined
      ? JSON.stringify(outfile)
      : `${JSON.stringify(outfile)}, ${JSON.stringify(openapiName)}`
  const logProgressMessage = JSON.stringify(`[${functionName}] syncing enums to ${outfile}...`)

  const contents = `\
import { DreamCLI } from '@rvoh/dream/system'
import { PsychicApp } from "@rvoh/psychic"
import { PsychicBin } from "@rvoh/psychic/system"
import AppEnv from '../AppEnv.js'

export default function ${functionName}(psy: PsychicApp) {
  psy.on('cli:sync', async () => {
    if (AppEnv.isDevelopmentOrTest) {
      await DreamCLI.logger.logProgress(${logProgressMessage}, async () => {
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

    // overwrite: true is pre-given consent for non-interactive callers —
    // exactly what answering y at the prompt would do
    if (!overwrite) {
      const confirmed = await confirm([initializerPath])
      if (!confirmed) {
        console.log(`Declined overwrite of ${initializerPath}; leaving the existing file untouched.`)
        return
      }
    }
  }

  try {
    await fs.access(destDir)
  } catch {
    await fs.mkdir(destDir, { recursive: true })
  }

  await fs.writeFile(initializerPath, contents)
}
