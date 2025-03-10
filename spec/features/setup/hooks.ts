import { DreamApplication } from '@rvoh/dream'
import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { providePuppeteerViteMatchers } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

provideDreamViteMatchers()
providePuppeteerViteMatchers()

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
