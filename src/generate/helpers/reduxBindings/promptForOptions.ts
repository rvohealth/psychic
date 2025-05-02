import { camelize, pascalize } from '@rvoh/dream'
import cliPrompt from '../../../cli/helpers/cli-prompt.js'
import PsychicApp from '../../../psychic-app/index.js'
import { OpenapiReduxBindingsOptions } from '../../openapi/reduxBindings.js'

export default async function promptForOptions(
  options: OpenapiReduxBindingsOptions,
): Promise<Required<OpenapiReduxBindingsOptions>> {
  if (!options.schemaFile) {
    const defaultVal = './openapi/openapi.json'
    const answer = await cliPrompt(`\
What would you like the schemaFile to be?

The schemaFile is the openapi file that @rtk-query/codegen-openapi will read to produce
all of its redux bindings. If not provided, it will default to

  ${defaultVal}
`)
    options.schemaFile = answer || defaultVal
  }

  if (!options.exportName) {
    const defaultVal = `${camelize(PsychicApp.getOrFail().appName)}Api`
    const answer = await cliPrompt(`\
What would you like the exportName to be?

The exportName is used to name the final output of the @rtk-query/codegen-openapi utility.
It will encase all of the backend endpoints that have been consumed via the specified openapi
file. We recommend naming it something like the name of your app, i.e.

  ${defaultVal}
`)
    options.exportName = answer || defaultVal
  }

  if (!options.outputFile) {
    const defaultVal = `../client/app/api/${camelize(options.exportName)}.ts`
    const answer = await cliPrompt(`\
What would you like the outputFile to be?

The outputFile is the path to the generated openapi redux bindings. If not provided,
it will default to:

  ${defaultVal}
`)
    options.outputFile = answer || defaultVal
  }

  if (!options.apiFile) {
    const defaultVal = '../client/app/api/api.ts'
    const answer = await cliPrompt(`\
What would you like the path to your apiFile to be?

The apiFile option specifies which base api file to use to mix in your backend endpoints with.
This option is provided by the @rtk-query/codegen-openapi library to enable you to define
custom api behavior, such as defining a base url, adding header preparation steps, etc...

We expect you to provide this path with the api root in mind, so you will need to consider
how to travel to the desired filepath from within your psychic project, i.e.

  ${defaultVal}
`)
    options.apiFile = answer || defaultVal
  }

  if (!options.apiImport) {
    const defaultVal = `empty${pascalize(options.exportName)}`
    const answer = await cliPrompt(`\
What would you like the path to your apiImport to be?

The apiImport option specifies the export key for the api module being exported from the
file found at the apiFile path.

This option is provided by the @rtk-query/codegen-openapi library to inform it of which
named export in your apiFile it should be mixing your backend api with. If not provided,
it will default to

  ${defaultVal}
`)
    options.apiImport = answer || defaultVal
  }

  return options as Required<OpenapiReduxBindingsOptions>
}
