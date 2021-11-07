import Migration from 'src/migrate/migration'
import db from 'src/db'

let migrate = new Migration()

describe('Migration#addColumn', () => {
  it ('passes along to db', async () => {
    const spy = posess(db, 'addColumn').returning({})
    await migrate.addColumn('users', 'email', 'text', {})
    expect(spy).toHaveBeenCalledWith('users', 'email', 'text', {})
  })

  it ('passes options to db', async () => {
    const spy = posess(db, 'addColumn').returning({})
    await migrate.addColumn('users', 'account_balance', 'float', { precision: 3 })
    expect(spy).toHaveBeenCalledWith('users', 'account_balance', 'float', { precision: 3 })
  })
})
