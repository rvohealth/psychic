import { jest } from '@jest/globals'
import db from 'src/db'
import SchemaWriter from 'src/migrate/schema-writer'

beforeAll(async () => {
  // await db.create()
})

beforeEach(async () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
  await db.dropAllTables()
})

afterEach(async () => {
  SchemaWriter.destroy()
})
