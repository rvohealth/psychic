import { Factory } from 'psychic/psyspec'
import { jest } from '@jest/globals'
import psychic, { config, db } from 'psychic'

import packagedDreams from 'app/pkg/dreams.pkg.js'
import packagedChannels from 'app/pkg/channels.pkg.js'
import packagedProjections from 'app/pkg/projections.pkg.js'
import routeCB from 'config/routes.js'
import dbSeedCB from 'db/seed.js'

jest.setTimeout(60 * 1000)

beforeEach(async () => {
  await psychic.boot()
  Factory.boot(packagedDreams)

  jest.clearAllMocks()
  jest.restoreAllMocks()
})

afterEach(async () => {
  await db.flush()
  await db.truncateAll()
})
