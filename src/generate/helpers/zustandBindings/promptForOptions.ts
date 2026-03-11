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

The schemaFile is the openapi file that @hey-api/openapi-ts will read to produce
all of its typed API functions and types. If not provided, it will default to

  ${defaultVal}
`)
    options.schemaFile = answer || defaultVal
  }

  if (!options.exportName) {
    const defaultVal = `${camelize(PsychicApp.getOrFail().appName)}Api`
    const answer = await cliPrompt(`\
What would you like the exportName to be?

The exportName is used to name the generated API output. It will be used to name
the initializer and config files. We recommend naming it something like the name
of your app, i.e.

  ${defaultVal}
`)
    options.exportName = answer || defaultVal
  }

  if (!options.outputDir) {
    const defaultVal = `../client/app/api/${camelize(options.exportName)}`
    const answer = await cliPrompt(`\
What would you like the outputDir to be?

The outputDir is the directory where @hey-api/openapi-ts will generate the typed
API functions and types. It will contain files like types.gen.ts and sdk.gen.ts.
If not provided, it will default to:

  ${defaultVal}
`)
    options.outputDir = answer || defaultVal
  }

  if (!options.clientConfigFile) {
    const defaultVal = `../client/app/api/${camelize(options.exportName)}/client.ts`
    const answer = await cliPrompt(`\
What would you like the path to your clientConfigFile to be?

The clientConfigFile specifies where to generate the client configuration file
that configures @hey-api/client-fetch with your base URL, credentials, and
other request options.

We expect you to provide this path with the api root in mind, so you will need
to consider how to travel to the desired filepath from within your psychic
project, i.e.

  ${defaultVal}
`)
    options.clientConfigFile = answer || defaultVal
  }

  return options as Required<OpenapiZustandBindingsOptions>
}
