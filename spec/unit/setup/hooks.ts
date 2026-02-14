import { Dream, DreamApp } from '@rvoh/dream'
import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'

provideDreamViteMatchers(Dream)

// define global context variable, setting it equal to describe
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).context = describe

beforeEach(async () => {
  try {
    await initializePsychicApp()
  } catch (error) {
    console.error(error)
    throw error
  }

  await truncate(DreamApp)
})
