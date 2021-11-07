import Dir from 'src/helpers/dir'
import db from 'src/db'
import Boot from 'src/psychic/boot'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

beforeEach(async () => {
  await Dir.rmIfExists('tmp/spec/psy')
  await new Boot('spec/support/testapp').boot()

  jest.clearAllMocks()
  jest.restoreAllMocks()

  await db.createIfNotExists()
  await db.dropAllTables()
  await Dir.mkdirUnlessExists('tmp/spec/psy')
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

