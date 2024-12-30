import { DreamApplication } from '@rvohealth/dream'
import { truncate } from '@rvohealth/dream-spec-helpers'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

jest.setTimeout(
  (process.env.JEST_FEATURE_TIMEOUT_SECONDS && parseInt(process.env.JEST_FEATURE_TIMEOUT_SECONDS) * 1000) ||
    125000,
)

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  await truncate(DreamApplication)
}, 120000)
