import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/singletons/db'

let migrate = new Migration()

describe('Migration#dropTable', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'dropTable').mockReturnValue({})

    await migrate.dropTable('hamncheese')
    expect(spy).toHaveBeenCalledWith('hamncheese')
    spy.mockRestore()
  })
})
