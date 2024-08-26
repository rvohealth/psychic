import '@rvohealth/psychic-spec-helpers'
import '../../../src/conf/loadEnv'

import { DreamApplication } from '@rvohealth/dream'
import { truncate } from '@rvohealth/dream-spec-helpers'
import initializePsychicApplication from '../../../src/cli/helpers/initializePsychicApplication'

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  await truncate(DreamApplication)
})
