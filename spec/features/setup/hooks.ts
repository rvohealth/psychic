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

// define global context variable, setting it equal to describe
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).context = describe

// this is done so that the `@jest-mock/express` library can continue
// to function. Since jest and vi have near parity, this seems to work,
// though it is very hacky, and we should eventually back out of it.
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).jest = vi

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
