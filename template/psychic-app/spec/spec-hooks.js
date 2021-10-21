import { Factory } from 'psychic/psyspec'
import { jest } from '@jest/globals'
import { config, db } from 'psychic'

import packagedDreams from 'app/pkg/dreams.pkg.js'
import packagedChannels from 'app/pkg/channels.pkg.js'
import packagedProjections from 'app/pkg/projections.pkg.js'
import routeCB from 'config/routes.js'
import dbSeedCB from 'db/seed.js'

beforeEach(async () => {
  const messagesConfig = await loadYaml('config/messages')
  const dbConfig = await loadYaml('config/database')
  const redisConfig = await loadYaml('config/redis')
  const telekinesisConfig = await loadYaml('config/telekinesis')
  const ghostsConfig = await loadYaml('config/ghosts')
  const pathsConfig = await loadYaml('config/paths')

  Factory.boot(packagedDreams)

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
})

afterEach(async () => {
  await db.flush()
  await db.truncateAll()
})

// // https://stackoverflow.com/questions/50121134/how-do-i-fail-a-test-in-jest-when-an-uncaught-promise-rejection-occurs
// // this helps point to underlying failure in code
// if (!process.env.LISTENING_TO_UNHANDLED_REJECTION) {
//   process.on('unhandledRejection', reason => {
//     throw reason
//   })
//   // Avoid memory leak by adding too many listeners
//   process.env.LISTENING_TO_UNHANDLED_REJECTION = true
// }

// expect.extend({
//   async toThrowAsync(received, errorClass=null) {
//     const successMessage = {
//       pass: true,
//       message: `Expected and received ${errorClass?.constructor?.name || 'error'}`,
//     }

//     let error
//     try {
//       await received()
//     } catch (err) {
//       error = err
//     }

//     if (!error) return {
//       pass: false,
//       message: `Expected ${errorClass.constructor.name || 'an error'}, but no error was raised`
//     }

//     if (!errorClass) return successMessage
//     if (error.constructor === errorClass) return successMessage

//     return {
//       pass: false,
//       message: `Expected ${errorClass.constructor.name}, received ${error.constructor.name}`,
//     }
//   }
// })
