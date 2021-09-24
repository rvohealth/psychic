import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#create', () => {
  it ('creates a new DB based on the underlying app configuration', async () => {
    const spy = jest.fn()
    posess(db, 'adapter', 'get').returning({ createDB: spy, closeConnection: () => {} })
    await db.create()
    expect(spy).toHaveBeenCalled()
  })
})
