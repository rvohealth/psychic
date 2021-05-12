import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#dropTable', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'dropTable').mockReturnValue({})

    await migrate.dropTable('hamncheese')
    expect(spy).toHaveBeenCalledWith('hamncheese')
    spy.mockRestore()
  })
})
