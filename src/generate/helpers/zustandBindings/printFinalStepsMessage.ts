import { DreamCLI } from '@rvoh/dream/system'
import colorize from '../../../cli/helpers/colorize.js'
import { OpenapiZustandBindingsOptions } from '../../openapi/zustandBindings.js'

export default function printFinalStepsMessage(opts: Required<OpenapiZustandBindingsOptions>) {
  const importLine = colorize(`+ import '${opts.clientConfigFile}'`, { color: 'green' })
  const sdkImportLine = colorize(
    `+ import { getAdminCities, postAdminCities } from '${opts.outputDir}/sdk.gen'`,
    {
      color: 'green',
    },
  )

  const usageLine = colorize(`  const { data, error } = await getAdminCities()`, {
    color: 'green',
  })

  const storeImportLine = colorize(`+ import { useGetAdminCities } from '${opts.outputDir}/store.gen'`, {
    color: 'green',
  })

  DreamCLI.logger.log(
    `
Finished generating @hey-api/openapi-ts bindings for your application.

First, you will need to be sure to sync, so that the typed API functions
and Zustand store are generated from your openapi schema:

  pnpm psy sync

This will generate typed API functions in ${opts.outputDir}/sdk.gen.ts
and a Zustand store in ${opts.outputDir}/store.gen.ts

To use the generated API, first import the client config at your app's
entry point to configure the base URL and credentials:

${importLine}

Then import and use the generated typed functions anywhere:

${sdkImportLine}

// all functions are fully typed with request params and response types
${usageLine}

Or use the auto-generated Zustand store hooks for state management:

${storeImportLine}

// each hook provides { data, error, isLoading, fetch, reset }
const { data, isLoading, fetch } = useGetAdminCities()
`,
    { logPrefix: '' },
  )
}
