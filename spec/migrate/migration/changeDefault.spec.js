import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/singletons/db'

let migrate = new Migration()

describe('Migration#changeDefault', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'changeDefault').mockReturnValue({})

    await migrate.changeDefault('hamncheese', 'fishman', 1)
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fishman', 1)
    spy.mockRestore()
  })
})
