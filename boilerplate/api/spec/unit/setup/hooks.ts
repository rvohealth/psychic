import '../../../src/conf/loadEnv'
import '@rvohealth/psychic/spec-helpers'

import initializePsychicApplication from '../../../src/cli/helpers/initializePsychicApplication'
import { truncate } from '@rvohealth/dream/spec-helpers'

process.env.TS_SAFE = '1'

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  await truncate()
})
