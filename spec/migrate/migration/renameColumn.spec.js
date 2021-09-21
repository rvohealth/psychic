import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/singletons/db'

let migrate = new Migration()

describe('Migration#renameColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'renameColumn').mockReturnValue({})

    await migrate.renameColumn('hamncheese', 'fish', 'fish2')
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fish', 'fish2')
    spy.mockRestore()
  })
})
