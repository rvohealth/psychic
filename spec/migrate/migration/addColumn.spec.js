import { jest } from '@jest/globals'
import Migration from 'src/migrate/migration'
import db from 'src/singletons/db'

let migrate = new Migration()

describe('Migration#addColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'addColumn').mockReturnValue({})

    await migrate.addColumn('users', 'email', 'text', {})
    expect(spy).toHaveBeenCalledWith('users', 'email', 'text', {})
    spy.mockRestore()
  })
})
