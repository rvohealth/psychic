import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/singletons/db'

let migrate = new Migration()
const cb = t => {
  t.string('email')
}

describe('Migration#table#create', () => {
  it ('passes statements along to database layer for processing', async () => {
    const spy = jest.spyOn(db, 'createTable')

    await migrate.createTable('hamncheese', cb)
    expect(spy).toHaveBeenCalledWith('hamncheese', cb)
    spy.mockRestore()
  })
})
