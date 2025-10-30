import '../../../src/helpers/loadEnv.js'

import PsychicBin from '../../../src/bin/index.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'
import rmTmpFile from '../../helpers/rmTmpFile.js'

export async function setup() {
  await initializePsychicApp()
  await PsychicBin.syncOpenapiJson()
}

export async function teardown() {
  await rmTmpFile()
  process.exit()
}
