import '../../../src/helpers/loadEnv'

import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'
import { startDevServer, stopDevServer } from './startDevServer'

export async function setup() {
  await initializePsychicApplication()

  startDevServer()
}

export function teardown() {
  stopDevServer()
}
