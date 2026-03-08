import { DreamCLI } from '@rvoh/dream/system'
import PackageManager from '../../cli/helpers/PackageManager.js'
import printFinalStepsMessage from '../helpers/zustandBindings/printFinalStepsMessage.js'
import promptForOptions from '../helpers/zustandBindings/promptForOptions.js'
import writeApiClientFile from '../helpers/zustandBindings/writeApiClientFile.js'
import writeInitializer from '../helpers/zustandBindings/writeInitializer.js'

/**
 * @internal
 *
 * used by the psychic CLI to generate boilerplate
 * that can be used to integrate a specific openapi.json
 * file with a client using zustand + openapi-fetch.
 *
 * * generates a typed openapi-fetch client file
 * * generates an initializer, which taps into the sync hooks
 *   to automatically run openapi-typescript to keep types in sync
 * * prints a helpful message, instructing devs on the final
 *   steps for hooking into the newly-generated api mechanisms
 *   within their client application's zustand stores.
 */
export default async function generateOpenapiZustandBindings(options: OpenapiZustandBindingsOptions = {}) {
  const opts = await promptForOptions(options)
  await writeApiClientFile(opts)
  await writeInitializer(opts)
  await DreamCLI.spawn(PackageManager.add(['openapi-fetch', 'openapi-typescript'], { dev: true }))
  printFinalStepsMessage(opts)
}

export interface OpenapiZustandBindingsOptions {
  exportName?: string
  schemaFile?: string
  outputDir?: string
  typesFile?: string
}
