import '../../../src/conf/global'
import { truncate } from '@rvohealth/dream/spec-helpers'

process.env.APP_ROOT_PATH = process.cwd()
process.env.TS_SAFE = '1'

jest.setTimeout(
  (process.env.JEST_FEATURE_TIMEOUT_SECONDS && parseInt(process.env.JEST_FEATURE_TIMEOUT_SECONDS) * 1000) ||
    25000
)

beforeEach(async () => {
  await truncate()
}, 15000)
