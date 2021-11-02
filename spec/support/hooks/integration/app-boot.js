// import packagedDreams from 'tmp/integrationtestapp/.dist/app/pkg/dreams.pkg.js'
// import packagedChannels from 'tmp/integrationtestapp/.dist/app/pkg/channels.pkg.js'
// import packagedProjections from 'tmp/integrationtestapp/.dist/app/pkg/projections.pkg.js'
// import routeCB from 'tmp/integrationtestapp/.dist/config/routes.js'
// import dbSeedCB from 'tmp/integrationtestapp/.dist/db/seed.js'
// import Dir from 'src/helpers/dir'
// import config from 'src/config'
// import db from 'src/db'
import rebootApp from 'spec/support/helpers/integration/reboot-app'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

beforeEach(async () => {
  await rebootApp()
  // const messagesConfig = await loadYaml('tmp/integrationtestapp/config/messages')
  // const dbConfig = await loadYaml('tmp/integrationtestapp/config/database')
  // const redisConfig = await loadYaml('tmp/integrationtestapp/config/redis')
  // const telekinesisConfig = await loadYaml('tmp/integrationtestapp/config/telekinesis')
  // const ghostsConfig = await loadYaml('tmp/integrationtestapp/config/ghosts')
  // const pathsConfig = await loadYaml('tmp/integrationtestapp/config/paths')
  // const packagedDreams = await import('tmp/integrationtestapp/.dist/app/pkg/dreams.pkg.js')
  // const packagedChannels = await import('tmp/integrationtestapp/.dist/app/pkg/channels.pkg.js')
  // const packagedProjections = await import('tmp/integrationtestapp/.dist/app/pkg/projections.pkg.js')
  // const routeCB = await import('tmp/integrationtestapp/.dist/config/routes.js')
  // const dbSeedCB = await import('tmp/integrationtestapp/.dist/db/seed.js')
  // const Dir = await import('src/helpers/dir')
  // const config = await import('src/config')
  // const db = await import('src/db')


  // config.boot({
  //   dreams: packagedDreams,
  //   channels: packagedChannels,
  //   projections: packagedProjections,
  //   dbConfig,
  //   dbSeedCB,
  //   pathsConfig,
  //   redisConfig,
  //   routeCB,
  //   messagesConfig,
  //   telekinesisConfig,
  //   ghostsConfig,
  // })

  jest.clearAllMocks()
  jest.restoreAllMocks()

  await db.createIfNotExists()
  await db.dropAllTables()
  await Dir.mkdirUnlessExists('tmp/spec/psy')
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

