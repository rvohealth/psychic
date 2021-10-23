import packagedDreams from 'spec/support/testapp/app/pkg/dreams.pkg.js'
import packagedChannels from 'spec/support/testapp/app/pkg/channels.pkg.js'
import packagedProjections from 'spec/support/testapp/app/pkg/projections.pkg.js'
import routeCB from 'spec/support/testapp/config/routes.js'
import dbSeedCB from 'spec/support/testapp/db/seed.js'
import Dir from 'src/helpers/dir'
import config from 'src/config'
import db from 'src/db'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

beforeEach(async () => {
  await Dir.rmIfExists('tmp/spec/psy')

  const messagesConfig = await loadYaml('spec/support/testapp/config/messages')
  const dbConfig = await loadYaml('spec/support/testapp/config/database')
  const redisConfig = await loadYaml('spec/support/testapp/config/redis')
  const telekinesisConfig = await loadYaml('spec/support/testapp/config/telekinesis')
  const ghostsConfig = await loadYaml('spec/support/testapp/config/ghosts')
  const pathsConfig = await loadYaml('spec/support/testapp/config/paths')

  config.boot({
    dreams: packagedDreams,
    channels: packagedChannels,
    projections: packagedProjections,
    dbConfig,
    dbSeedCB,
    pathsConfig,
    redisConfig,
    routeCB,
    messagesConfig,
    telekinesisConfig,
    ghostsConfig,
  })

  jest.clearAllMocks()
  jest.restoreAllMocks()

  await db.createIfNotExists()
  await db.dropAllTables()
  await Dir.mkdirUnlessExists('tmp/spec/psy')
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

