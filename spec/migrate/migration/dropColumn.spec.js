import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/db'

let migrate = new Migration()

describe('Migration#dropColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'dropColumn').mockReturnValue({})

    await migrate.dropColumn('hamncheese', 'fish')
    expect(spy).toHaveBeenCalledWith('hamncheese', 'fish')
    spy.mockRestore()
  })
})
