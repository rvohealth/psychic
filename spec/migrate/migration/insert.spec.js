import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/db'

let migrate = new Migration()

describe('Migration#insert', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'insert').mockReturnValue({})

    await migrate.insert('hamncheese', [{}])
    expect(spy).toHaveBeenCalledWith('hamncheese', [{}])
    spy.mockRestore()
  })
})
