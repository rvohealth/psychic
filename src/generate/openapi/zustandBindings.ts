import path from 'node:path'
import { DreamCLI } from '@rvoh/dream/system'
import applyConfirmedWriteSet, { ConfirmOverwriteFn } from '../../cli/helpers/applyConfirmedWriteSet.js'
import PackageManager from '../../cli/helpers/PackageManager.js'
import clientConfigFileTarget from '../helpers/zustandBindings/clientConfigFileTarget.js'
import initializerTarget from '../helpers/zustandBindings/initializerTarget.js'
import printFinalStepsMessage from '../helpers/zustandBindings/printFinalStepsMessage.js'
import promptForOptions from '../helpers/zustandBindings/promptForOptions.js'

/**
 * @internal
 *
 * used by the psychic CLI to generate boilerplate
 * that can be used to integrate a specific openapi.json
 * file with a client using @hey-api/openapi-ts.
 *
 * * generates the client config file
 * * generates an initializer, which taps into the sync hooks
 *   to automatically run the @hey-api/openapi-ts CLI util
 *   and generate a zustand store from the SDK output
 * * prints a helpful message, instructing devs on the final
 *   steps for using the generated typed API functions
 *   within their client application.
 *
 * Re-run behavior: the full write-set is compared against disk before any
 * write. Missing files are created and byte-identical files are silently left
 * alone, but when any file exists with different content — including the
 * user-customizable client config scaffold — a single confirmation listing
 * every affected path is required before the first write (an unanswerable
 * prompt — no TTY, bypassed, or empty answer — fails loudly). Declining leaves
 * every file untouched and skips the follow-on package install.
 */
export default async function generateOpenapiZustandBindings(
  options: OpenapiZustandBindingsOptions = {},
  {
    confirm,
    overwrite = false,
  }: {
    confirm?: ConfirmOverwriteFn
    overwrite?: boolean
  } = {},
) {
  const opts = await promptForOptions(options)
  assertClientConfigFileOutsideOutputDir(opts)

  const applied = await applyConfirmedWriteSet([clientConfigFileTarget(opts), initializerTarget(opts)], {
    confirm,
    overwrite,
  })
  if (!applied) return

  const { command, args } = PackageManager.add(['@hey-api/openapi-ts'], { dev: true })
  await DreamCLI.spawn(command, { args })
  printFinalStepsMessage(opts)
}

// @hey-api/openapi-ts deletes outputDir on every run, so a clientConfigFile
// at or under it would be deleted by the next sync
function assertClientConfigFileOutsideOutputDir({
  outputDir,
  clientConfigFile,
}: Required<OpenapiZustandBindingsOptions>) {
  const relative = path.relative(path.resolve(outputDir), path.resolve(clientConfigFile))
  const outside = relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)
  const nested = relative === '' || !outside
  if (!nested) return

  throw new Error(`\
clientConfigFile (${clientConfigFile}) is inside outputDir (${outputDir}).

@hey-api/openapi-ts deletes outputDir on every sync, so the next \`psy sync\`
would delete your client config file. Choose a clientConfigFile outside of
outputDir, i.e. generate into a subfolder:

  --output-dir=../client/app/api/backend/generated
  --client-config-file=../client/app/api/backend/client.ts`)
}

export interface OpenapiZustandBindingsOptions {
  exportName?: string
  schemaFile?: string
  outputDir?: string
  clientConfigFile?: string
}
