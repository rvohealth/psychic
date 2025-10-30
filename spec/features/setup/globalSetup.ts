import '../../../src/helpers/loadEnv.js'

import PsychicDevtools from '../../../src/devtools/PsychicDevtools.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'

export async function setup() {
  await initializePsychicApp()
  await PsychicDevtools.launchDevServer('client', { port: 3000, cmd: 'yarn client:fspec' })
}

export function teardown() {
  PsychicDevtools.stopDevServers()
}
