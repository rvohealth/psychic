import '../../../src/conf/loadEnv'
import '@rvohealth/psychic/spec-helpers'
import { Psyconf } from '@rvohealth/psychic'
import { truncate } from '@rvohealth/dream/spec-helpers'

process.env.APP_ROOT_PATH = process.cwd()
process.env.TS_SAFE = '1'

beforeEach(async () => {
  await Psyconf.configure()
  await truncate()
})
