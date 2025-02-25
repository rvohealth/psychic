import '../../../src/helpers/loadEnv'

import { PsychicBin } from '../../../src'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

export default async () => {
  await initializePsychicApplication()
  await PsychicBin.syncOpenapiJson()
}
