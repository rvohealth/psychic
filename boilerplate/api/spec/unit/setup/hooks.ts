import '@rvohealth/psychic-spec-helpers'
import '../../../src/conf/global'

import { DreamApplication } from '@rvohealth/dream'
import { truncate } from '@rvohealth/dream-spec-helpers'
import * as dotenv from 'dotenv'
import initializePsychicApplication from '../../../src/cli/helpers/initializePsychicApplication'
import inflections from '../../../src/conf/inflections'

dotenv.config({ path: '.env.test' })

beforeEach(async () => {
  try {
    await initializePsychicApplication()
  } catch (err) {
    console.error(err)
    throw err
  }

  inflections()
  await truncate(DreamApplication)
}, 15000)
