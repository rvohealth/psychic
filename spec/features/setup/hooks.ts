// import 'vitest-puppeteer'
// import 'expect-puppeteer'
import './matchers'

import { truncate } from '@rvohealth/dream-spec-helpers'
import { DreamApplication } from '@rvohealth/dream'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'
import { PsychicServer } from '../../../src'

// vi.setTimeout(
//   (process.env.JEST_FEATURE_TIMEOUT_SECONDS && parseInt(process.env.JEST_FEATURE_TIMEOUT_SECONDS) * 1000) ||
//     125000,
// )

let server: PsychicServer

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  server = new PsychicServer()
  await server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))

  await truncate(DreamApplication)
}, 120000)

afterEach(async () => {
  await server.stop({ bypassClosingDbConnections: true })
})
