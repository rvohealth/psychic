import { jest } from '@jest/globals'
import db from 'src/singletons/db'
import config from 'src/singletons/config'
import SchemaWriter from 'src/migrate/schema-writer'
import fileExists from 'src/helpers/file-exists'
import { mkdir } from 'fs/promises'

import packagedDreams from 'spec/support/testapp/app/pkg/dreams.pkg.js'
import packagedChannels from 'spec/support/testapp/app/pkg/channels.pkg.js'
import packagedProjections from 'spec/support/testapp/app/pkg/projections.pkg.js'
import routeCB from 'spec/support/testapp/config/routes.js'
import dbSeedCB from 'spec/support/testapp/db/seed.js'

beforeAll(async () => {
  if (! (await fileExists('tmp')))
    await mkdir('tmp')

  if (! (await fileExists('tmp/storage')))
    await mkdir('tmp/storage')

  if (! (await fileExists('tmp/storage/spec')))
    await mkdir('tmp/storage/spec')
})

beforeEach(async () => {
  const messagesConfig = await loadYaml('spec/support/testapp/config/messages')
  const dbConfig = await loadYaml('spec/support/testapp/config/database')
  const redisConfig = await loadYaml('spec/support/testapp/config/redis')
  const telekinesisConfig = await loadYaml('spec/support/testapp/config/telekinesis')

  config.boot({
    dreams: packagedDreams,
    channels: packagedChannels,
    projections: packagedProjections,
    dbConfig,
    dbSeedCB,
    redisConfig,
    routeCB,
    messagesConfig,
    telekinesisConfig,
  })

  jest.clearAllMocks()
  jest.restoreAllMocks()

  await db.createIfNotExists()
  await db.dropAllTables()
  // await rmdir('tmp/storage/spec/*', { recursive: true })
})

afterEach(async () => {
  SchemaWriter.destroy()
})
