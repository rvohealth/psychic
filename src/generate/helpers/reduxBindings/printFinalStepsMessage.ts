import { DreamCLI } from '@rvoh/dream'
import colorize from '../../../cli/helpers/colorize.js'
import { OpenapiReduxBindingsOptions } from '../../openapi/reduxBindings.js'

export default function printFinalStepsMessage(
  opts: OpenapiReduxBindingsOptions,
  { rtkError, tsNodeError }: { rtkError: boolean; tsNodeError: boolean },
) {
  const importLine = colorize(`+ import { ${opts.exportName} } from '${opts.apiFile}'`, { color: 'green' })
  const reducerLine = colorize(`    + [${opts.exportName}.reducerPath]: ${opts.exportName}.reducer,`, {
    color: 'green',
  })
  const middlewareLine = colorize(`  + middleware: gDM => gDM().concat(${opts.exportName}.middleware),`, {
    color: 'green',
  })

  DreamCLI.logger.log(
    `
Finished generating redux bindings for your application,
but to wire them into your app, we're going to need your help.
Be sure to add the following to your root store to bind your new
api module into your redux app, i.e.

// add this line, fix the import path if necessary
${importLine}

export const store = configureStore({
  reducer: {
    // ...
    // add this line
${reducerLine}
  },
  
  // add this line
${middlewareLine}
})
`,
    { logPrefix: '' },
  )

  if (rtkError) {
    DreamCLI.logger.log(
      `
NOTE: we failed to add @rtk-query/codegen-openapi as a dependency for you.
Usually, this is because you already have this package as a non-dev dependency.
If this is intentional, you can ignore this message.
`,
      { logPrefix: '' },
    )
  }

  if (tsNodeError) {
    DreamCLI.logger.log(
      `
NOTE: we failed to add ts-node as a dependency for you.
Usually, this is because you already have this package as a non-dev dependency.
If this is intentional, you can ignore this message.
`,
      { logPrefix: '' },
    )
  }
}
