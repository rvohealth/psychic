import { jest } from '@jest/globals'

import 'src/psychic/boot/all'
import 'src/psychic/boot/globals/core-spec'

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
import Dir from 'src/helpers/dir'

import 'spec/factories'

process.env.CORE_TEST = ENV.CORE_TEST = true
process.env.PSYCHIC_SECRET = ENV.PSYCHIC_SECRET = 'black cats are the coolest'
process.env.PSYCHIC_WSS_PORT = ENV.PSYCHIC_WSS_PORT = 889

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

afterEach(async () => {
  await SchemaWriter.destroy()
  await Dir.rmIfExists('tmp/spec/psy')
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
