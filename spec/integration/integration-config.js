process.env.CORE_INTEGRATION_TEST = true
process.env.CORE_INTEGRATION_BUT_USING_ROOT_PATH = true
process.env.DB_NAME = 'core_development'

import 'src/psychic/boot/all'
import 'src/psychic/boot/globals/core-spec' // may need to partition this file into multiple
import 'src/psychic/boot/globals/integration-spec'

import 'spec/factories'
import 'spec/support/extensions/to-throw-async'
import 'spec/support/hooks/clarify-spec-failures'

// import 'spec/support/hooks/integration/app-boot'
import 'spec/support/hooks/build-tmp-storage'
import 'spec/support/hooks/cleanup-between-integration-specs'

jest.setTimeout(60 * 1000)

beforeEach(async () => {
  await resetIntegrationApp()
  await swapIntegrationFiles('spec/integration/swap')
})
