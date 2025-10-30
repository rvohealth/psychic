import { DreamCLI } from '@rvoh/dream/system'
import PackageManager from '../../../cli/helpers/PackageManager.js'
import EnvInternal from '../../../helpers/EnvInternal.js'

export default async function installOpenapiTypescript() {
  if (EnvInternal.isTest) return

  const cmd = PackageManager.add('openapi-typescript', { dev: true })

  try {
    await DreamCLI.spawn(cmd)
  } catch (err) {
    console.log(`Failed to install openapi-typescript as a dev dependency. Please make sure the following command succeeds:

"${cmd}"
`)
  }
}
