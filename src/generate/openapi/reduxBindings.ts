import { DreamCLI } from '@rvoh/dream'
import PackageManager from '../../cli/helpers/PackageManager.js'
import printFinalStepsMessage from '../helpers/reduxBindings/printFinalStepsMessage.js'
import promptForOptions from '../helpers/reduxBindings/promptForOptions.js'
import writeApiFile from '../helpers/reduxBindings/writeApiFile.js'
import writeInitializer from '../helpers/reduxBindings/writeInitializer.js'
import writeOpenapiJsonFile from '../helpers/reduxBindings/writeOpenapiJsonFile.js'

/**
 * @internal
 *
 * used by the psychic CLI to generate boilerplate
 * that can be used to integrate a specific openapi.json
 * file with a specific client.
 *
 * * generates a json config file for @rtk-query/codegen-openapi
 * * generates the api file if it does not exist
 * * generates an initializer, which taps into the sync hooks
 *   to automatically run the @rtk-query/codegen-openapi CLI util
 * * prints a helpful message, instructing devs on the final
 *   steps for hooking into the newly-generated api mechanisms
 *   within their client application's redux store.
 */
export default async function generateOpenapiReduxBindings(options: OpenapiReduxBindingsOptions = {}) {
  const opts = await promptForOptions(options)
  await writeOpenapiJsonFile(opts)

  await writeApiFile(opts)
  await writeInitializer(opts)
  await DreamCLI.spawn(PackageManager.add(['@rtk-query/codegen-openapi', 'ts-node'], { dev: true }))
  printFinalStepsMessage(opts)
}

export interface OpenapiReduxBindingsOptions {
  exportName?: string
  schemaFile?: string
  apiFile?: string
  apiImport?: string
  outputFile?: string
}
