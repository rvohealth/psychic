import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()
const cb = t => {
  t.string('email')
}

describe('Migrate#table#create', () => {
  it ('passes statements along to database layer for processing', async () => {
    const spy = jest.spyOn(db, 'createTable')

    await migrate.createTable('hamncheese', cb)
    expect(spy).toHaveBeenCalledWith('hamncheese', cb)
    spy.mockRestore()
  })
})
