// import packagedDreams from 'tmp/integrationtestapp/.dist/app/pkg/dreams.pkg.js'
// import packagedChannels from 'tmp/integrationtestapp/.dist/app/pkg/channels.pkg.js'
// import packagedProjections from 'tmp/integrationtestapp/.dist/app/pkg/projections.pkg.js'
// import routeCB from 'tmp/integrationtestapp/.dist/config/routes.js'
// import dbSeedCB from 'tmp/integrationtestapp/.dist/db/seed.js'
// import Dir from 'src/helpers/dir'
import rebootApp from 'spec/support/helpers/integration/reboot-app'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

beforeEach(async () => {
  await rebootApp()

  jest.clearAllMocks()
  jest.restoreAllMocks()
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

