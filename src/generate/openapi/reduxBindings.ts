import { DreamCLI } from '@rvoh/dream/system'
import applyConfirmedWriteSet, { ConfirmOverwriteFn } from '../../cli/helpers/applyConfirmedWriteSet.js'
import PackageManager from '../../cli/helpers/PackageManager.js'
import apiFileTarget from '../helpers/reduxBindings/apiFileTarget.js'
import initializerTarget from '../helpers/reduxBindings/initializerTarget.js'
import openapiJsonFileTarget from '../helpers/reduxBindings/openapiJsonFileTarget.js'
import printFinalStepsMessage from '../helpers/reduxBindings/printFinalStepsMessage.js'
import promptForOptions from '../helpers/reduxBindings/promptForOptions.js'

/**
 * @internal
 *
 * used by the psychic CLI to generate boilerplate
 * that can be used to integrate a specific openapi.json
 * file with a specific client.
 *
 * * generates a json config file for @rtk-query/codegen-openapi
 * * generates the api file
 * * generates an initializer, which taps into the sync hooks
 *   to automatically run the @rtk-query/codegen-openapi CLI util
 * * prints a helpful message, instructing devs on the final
 *   steps for hooking into the newly-generated api mechanisms
 *   within their client application's redux store.
 *
 * Re-run behavior: the full write-set is compared against disk before any
 * write. Missing files are created and byte-identical files are silently left
 * alone, but when any file exists with different content — including the
 * user-customizable api file scaffold — a single confirmation listing every
 * affected path is required before the first write (an unanswerable prompt —
 * no TTY, bypassed, or empty answer — fails loudly). Declining leaves every
 * file untouched and skips the follow-on package install.
 */
export default async function generateOpenapiReduxBindings(
  options: OpenapiReduxBindingsOptions = {},
  {
    confirm,
    overwrite = false,
  }: {
    confirm?: ConfirmOverwriteFn
    overwrite?: boolean
  } = {},
) {
  const opts = await promptForOptions(options)

  const applied = await applyConfirmedWriteSet(
    [openapiJsonFileTarget(opts), apiFileTarget(opts), initializerTarget(opts)],
    { confirm, overwrite },
  )
  if (!applied) return

  const { command, args } = PackageManager.add(['@rtk-query/codegen-openapi', 'ts-node'], { dev: true })
  await DreamCLI.spawn(command, { args })
  printFinalStepsMessage(opts)
}

export interface OpenapiReduxBindingsOptions {
  exportName?: string
  schemaFile?: string
  apiFile?: string
  apiImport?: string
  outputFile?: string
}
