import { DreamCLI } from '@rvoh/dream/system'
import { camelize } from '@rvoh/dream/utils'
import colorize from '../../../cli/helpers/colorize.js'
import { OpenapiZustandBindingsOptions } from '../../openapi/zustandBindings.js'

export default function printFinalStepsMessage(opts: OpenapiZustandBindingsOptions) {
  const clientFile = `${opts.outputDir}/${camelize(opts.exportName!)}.ts`
  const importLine = colorize(`+ import { ${opts.exportName} } from '${clientFile}'`, { color: 'green' })

  DreamCLI.logger.log(
    `
Finished generating zustand + openapi-fetch bindings for your application,
but to wire them into your app, we're going to need your help.

First, you will need to be sure to sync, so that the new openapi
types are sent over to your client application.

Next, you can use the generated api client in your zustand stores, i.e.

${importLine}

${colorize(`+ import { create } from 'zustand'`, { color: 'green' })}

interface MyState {
  items: Item[]
  loading: boolean
  fetchItems: () => Promise<void>
}

export const useMyStore = create<MyState>((set) => ({
  items: [],
  loading: false,
  fetchItems: async () => {
    set({ loading: true })
    const { data } = await ${opts.exportName}.GET('/items')
    set({ items: data ?? [], loading: false })
  },
}))
`,
    { logPrefix: '' },
  )
}
