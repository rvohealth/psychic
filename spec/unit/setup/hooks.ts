import { DreamApplication } from '@rvoh/dream'
import { provideDreamViteMatchers, truncate } from '@rvoh/dream-spec-helpers'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication.js'

provideDreamViteMatchers()

// define global context variable, setting it equal to describe
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).context = describe

// this is done so that the `@jest-mock/express` library can continue
// to function. Since jest and vi have near parity, this seems to work,
// though it is very hacky, and we should eventually back out of it.
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
;(global as any).jest = vi

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (error) {
    console.error(error)
    throw error
  }

  await truncate(DreamApplication)
})
