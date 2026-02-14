import { Dream, DreamApp } from '@rvoh/dream'
import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import { providePuppeteerViteMatchers } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src/package-exports/index.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'
import getPage from '../helpers/getPage.js'

provideDreamViteMatchers(Dream)
providePuppeteerViteMatchers()

// define global context variable, setting it equal to describe
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).context = describe

let server: PsychicServer

beforeAll(async () => {
  try {
    await initializePsychicApp()
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
