import { jest } from '@jest/globals'
import db from 'src/db'
import config from 'src/config'
import SchemaWriter from 'src/migrate/schema-writer'
import fileExists from 'src/helpers/file-exists'
import { mkdir } from 'fs/promises'

import packagedDreams from 'spec/support/testapp/app/pkg/dreams.pkg.js'
import packagedChannels from 'spec/support/testapp/app/pkg/channels.pkg.js'
import packagedProjections from 'spec/support/testapp/app/pkg/projections.pkg.js'
import routeCB from 'spec/support/testapp/config/routes.js'
import dbSeedCB from 'spec/support/testapp/db/seed.js'
import 'spec/factories'

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
  await SchemaWriter.destroy()
  // await db.flush()
})

// https://stackoverflow.com/questions/50121134/how-do-i-fail-a-test-in-jest-when-an-uncaught-promise-rejection-occurs
// this helps point to underlying failure in code
if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
  process.on('unhandledRejection', reason => {
    throw reason
  })
  // Avoid memory leak by adding too many listeners
  process.env.LISTENING_TO_UNHANDLED_REJECTION = true
}

expect.extend({
  async toThrowAsync(received, errorClass=null) {
    const successMessage = {
      pass: true,
      message: `Expected and received ${errorClass?.constructor?.name || 'error'}`,
    }

    let error
    try {
      await received()
    } catch (err) {
      error = err
    }

    if (!error) return {
      pass: false,
      message: `Expected ${errorClass.constructor.name || 'an error'}, but no error was raised`
    }

    if (!errorClass) return successMessage
    if (error.constructor === errorClass) return successMessage

    return {
      pass: false,
      message: `Expected ${errorClass.constructor.name}, received ${error.constructor.name}`,
    }
  }
})
