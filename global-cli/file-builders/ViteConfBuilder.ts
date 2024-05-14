import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class ViteConfBuilder {
  public static build(userOptions: NewAppCLIOptions) {
    const frameworkName = clientFrameworkName(userOptions)

    return `
import { defineConfig } from 'vite'
import ${frameworkName} from '@vitejs/plugin-${frameworkName}'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [${frameworkName}()],
  server: {
    port: 3000,
  },
})
`
  }
}

function clientFrameworkName(userOptions: NewAppCLIOptions) {
  switch (userOptions.client) {
    case 'react':
      return 'react'

    case 'vue':
    case 'nuxt':
      return 'vue'

    default:
      throw new Error(`unrecognized client type when determining framework name: ${userOptions.client}`)
  }
}
