import { jest } from '@jest/globals'
import Migrate from 'src/migrate'
import db from 'src/db'

let migrate = new Migrate()

describe('Migrate#addColumn', () => {
  it ('passes along to db', async () => {
    const spy = jest.spyOn(db, 'addColumn').mockReturnValue({})

    await migrate.addColumn('users', 'email', 'text', {})
    expect(spy).toHaveBeenCalledWith('users', 'email', 'text', {})
    spy.mockRestore()
  })
})
