import { jest } from '@jest/globals'
import db from 'src/db'
import config from 'src/config'
import SchemaWriter from 'src/migrate/schema-writer'

import packagedDreams from 'spec/support/testapp/app/pkg/dreams.pkg.js'
import packagedChannels from 'spec/support/testapp/app/pkg/channels.pkg.js'
import packagedProjections from 'spec/support/testapp/app/pkg/projections.pkg.js'
import redisConfig from 'spec/support/testapp/config/redis.json'
import dbConfig from 'spec/support/testapp/config/database.json'
import routeCB from 'spec/support/testapp/config/routes.js'
import dbSeedCB from 'spec/support/testapp/db/seed.js'

beforeAll(async () => {
  // await db.create()
})

beforeEach(async () => {
  const messagesConfig = await loadYaml('spec/support/testapp/config/messages')

  config.boot({
    dreams: packagedDreams,
    channels: packagedChannels,
    projections: packagedProjections,
    dbConfig,
    dbSeedCB,
    redisConfig,
    routeCB,
    messagesConfig,
  })

  jest.clearAllMocks()
  jest.restoreAllMocks()
  await db.dropAllTables()

})

afterEach(async () => {
  SchemaWriter.destroy()
  await db.closeConnection()
})
