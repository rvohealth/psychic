import { DreamApp } from '@rvoh/dream'
import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { providePuppeteerViteMatchers } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/index.js'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication.js'
import getPage from '../helpers/getPage.js'

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

beforeAll(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  server = new PsychicServer()
  await server.start(parseInt(process.env.DEV_SERVER_PORT || '7778'))

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  if (!(global as any).page) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    ;(global as any).page = await getPage()
  }
})

beforeEach(async () => {
  await truncate(DreamApp)
})

afterAll(async () => {
  await server.stop()
})
