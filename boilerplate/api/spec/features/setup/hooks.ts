import '../../../src/conf/global'

import { truncate } from '@rvohealth/dream/spec-helpers'
import initializePsychicApplication from 'cli/helpers/initializePsychicApplication'

process.env.TS_SAFE = '1'

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

  await truncate()
}, 15000)
