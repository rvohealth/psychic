import { truncate } from '@rvohealth/dream/spec-helpers'
import initializePsychicApplication from '../../../test-app/cli/helpers/initializePsychicApplication'

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (error) {
    console.error(error)
    throw error
  }

  await truncate()
})
