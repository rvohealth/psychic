import { jest } from '@jest/globals'
import db from 'src/db'

describe('DB#addColumn adds column', () => {
  it ('calls addColumn on the underlying adapter', async () => {
    const spy = jest.fn()
    posess(db, 'adapter', 'get').returning({ addColumn: spy, closeConnection: () => {} })
    await db.addColumn('users', 'zimbo', 'text', { primary: true })
    expect(spy).toHaveBeenCalledWith('users', 'zimbo', 'text', { primary: true })
  })
})
