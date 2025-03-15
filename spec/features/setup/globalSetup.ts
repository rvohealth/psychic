import '../../../src/helpers/loadEnv'

import { launchViteServer, stopViteServer } from '@rvoh/psychic-spec-helpers'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication.js'

export async function setup() {
  await initializePsychicApplication()
  await launchViteServer({ port: 3000, cmd: 'yarn client' })
}

export function teardown() {
  stopViteServer()
}
