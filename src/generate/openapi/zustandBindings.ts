import { DreamCLI } from '@rvoh/dream/system'
import PackageManager from '../../cli/helpers/PackageManager.js'
import printFinalStepsMessage from '../helpers/zustandBindings/printFinalStepsMessage.js'
import promptForOptions from '../helpers/zustandBindings/promptForOptions.js'
import writeClientConfigFile from '../helpers/zustandBindings/writeClientConfigFile.js'
import writeInitializer from '../helpers/zustandBindings/writeInitializer.js'

/**
 * @internal
 *
 * used by the psychic CLI to generate boilerplate
 * that can be used to integrate a specific openapi.json
 * file with a client using @hey-api/openapi-ts.
 *
 * * generates the client config file if it does not exist
 * * generates an initializer, which taps into the sync hooks
 *   to automatically run the @hey-api/openapi-ts CLI util
 *   and generate a zustand store from the SDK output
 * * prints a helpful message, instructing devs on the final
 *   steps for using the generated typed API functions
 *   within their client application.
 */
export default async function generateOpenapiZustandBindings(options: OpenapiZustandBindingsOptions = {}) {
  const opts = await promptForOptions(options)
  await writeClientConfigFile(opts)
  await writeInitializer(opts)
  await DreamCLI.spawn(PackageManager.add(['@hey-api/openapi-ts'], { dev: true }))
  printFinalStepsMessage(opts)
}

export interface OpenapiZustandBindingsOptions {
  exportName?: string
  schemaFile?: string
  outputDir?: string
  clientConfigFile?: string
}
