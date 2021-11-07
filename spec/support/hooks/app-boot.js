import Dir from 'src/helpers/dir'
import db from 'src/db'
import packagedDreams from 'spec/support/testapp/app/pkg/dreams.pkg.js'
import packagedChannels from 'spec/support/testapp/app/pkg/channels.pkg.js'
import packagedProjections from 'spec/support/testapp/app/pkg/projections.pkg.js'
import routeCB from 'spec/support/testapp/config/routes.js'
import dbSeedCB from 'spec/support/testapp/db/seed.js'
import Boot from 'src/psychic/boot'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

beforeEach(async () => {
  await Dir.rmIfExists('tmp/spec/psy')
  await new Boot(
    'spec/support/testapp',
    {
      pkgRoot: '.dist/testapp',
      packagedDreams,
      packagedChannels,
      packagedProjections,
      routeCB,
      dbSeedCB,
    }
  ).boot()

  jest.clearAllMocks()
  jest.restoreAllMocks()

  await db.createIfNotExists()
  await db.dropAllTables()
  await Dir.mkdirUnlessExists('tmp/spec/psy')
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

