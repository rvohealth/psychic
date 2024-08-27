import '@rvohealth/psychic-spec-helpers'
import '../../../src/conf/global'

import { DreamApplication } from '@rvohealth/dream'
import { truncate } from '@rvohealth/dream-spec-helpers'
import initializePsychicApplication from '../../../src/cli/helpers/initializePsychicApplication'

jest.setTimeout(
  (process.env.JEST_FEATURE_TIMEOUT_SECONDS && parseInt(process.env.JEST_FEATURE_TIMEOUT_SECONDS) * 1000) ||
    25000,
)

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  await truncate(DreamApplication)
}, 50000)
