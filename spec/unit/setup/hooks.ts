import { DreamApplication } from '@rvohealth/dream'
import { truncate } from '@rvohealth/dream-spec-helpers'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (error) {
    console.error(error)
    throw error
  }

  await truncate(DreamApplication)
})
