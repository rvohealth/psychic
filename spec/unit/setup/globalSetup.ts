import '../../../src/helpers/loadEnv'

import { PsychicBin } from '../../../src.js'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication.js'
import rmTmpFile from '../../helpers/rmTmpFile.js'

export async function setup() {
  await initializePsychicApplication()
  await PsychicBin.syncOpenapiJson()
}

export async function teardown() {
  await rmTmpFile()
  process.exit()
}
