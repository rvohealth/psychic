import { DreamCLI } from '@rvoh/dream'
import colorize from '../../../cli/helpers/colorize.js'
import { OpenapiReduxBindingsOptions } from '../../openapi/reduxBindings.js'

export default function printFinalStepsMessage(opts: OpenapiReduxBindingsOptions) {
  const importLine = colorize(`+ import { ${opts.exportName} } from '${opts.outputFile}'`, { color: 'green' })
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

First, you will need to be sure to sync, so that the new openapi
types are sent over to your client application.

Next, be sure to add the following to your root store to bind your new
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
}
