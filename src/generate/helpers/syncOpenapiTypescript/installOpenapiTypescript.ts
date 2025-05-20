import { DreamCLI } from '@rvoh/dream'
import PackageManager from '../../../cli/helpers/PackageManager.js'

export default async function installOpenapiTypescript() {
  const cmd = PackageManager.add('openapi-typescript', { dev: true })

  try {
    await DreamCLI.spawn(cmd)
  } catch (err) {
    console.log(`Failed to install openapi-typescript as a dev dependency. Please make sure the following command succeeds:

"${cmd}"
`)
  }
}
