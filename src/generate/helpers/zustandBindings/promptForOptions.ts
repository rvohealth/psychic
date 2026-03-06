import { camelize } from '@rvoh/dream/utils'
import cliPrompt from '../../../cli/helpers/cli-prompt.js'
import PsychicApp from '../../../psychic-app/index.js'
import { OpenapiZustandBindingsOptions } from '../../openapi/zustandBindings.js'

export default async function promptForOptions(
  options: OpenapiZustandBindingsOptions,
): Promise<Required<OpenapiZustandBindingsOptions>> {
  if (!options.schemaFile) {
    const defaultVal = './src/openapi/openapi.json'
    const answer = await cliPrompt(`\
What would you like the schemaFile to be?

The schemaFile is the openapi file that openapi-typescript will read to produce
all of its type definitions. If not provided, it will default to

  ${defaultVal}
`)
    options.schemaFile = answer || defaultVal
  }

  if (!options.exportName) {
    const defaultVal = `${camelize(PsychicApp.getOrFail().appName)}Api`
    const answer = await cliPrompt(`\
What would you like the exportName to be?

The exportName is used to name the typed openapi-fetch client instance that will
be generated for use in your zustand stores. We recommend naming it something like
the name of your app, i.e.

  ${defaultVal}
`)
    options.exportName = answer || defaultVal
  }

  if (!options.outputDir) {
    const defaultVal = '../client/src/api'
    const answer = await cliPrompt(`\
What would you like the outputDir to be?

The outputDir is the directory where the generated api client and types files
will be written. If not provided, it will default to:

  ${defaultVal}
`)
    options.outputDir = answer || defaultVal
  }

  if (!options.typesFile) {
    const defaultVal = `${options.outputDir}/${camelize(options.exportName)}.types.d.ts`
    const answer = await cliPrompt(`\
What would you like the typesFile to be?

The typesFile is the path to the generated openapi TypeScript type definitions
that will be used by the api client. If not provided, it will default to:

  ${defaultVal}
`)
    options.typesFile = answer || defaultVal
  }

  return options as Required<OpenapiZustandBindingsOptions>
}
