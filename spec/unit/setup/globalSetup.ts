import '../../../src/helpers/loadEnv'

import { PsychicBin } from '../../../src'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'
import rmTmpFile from '../../helpers/rmTmpFile'

export async function setup() {
  await initializePsychicApplication()
  await PsychicBin.syncOpenapiJson()
}

export async function teardown() {
  // await rmTmpFile()
  process.exit()
}
