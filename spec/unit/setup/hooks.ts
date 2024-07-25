import { truncate } from '@rvohealth/dream/spec-helpers'
import { Psyconf } from '../../../src'

beforeEach(async () => {
  await Psyconf.configure()
  await truncate()
})
