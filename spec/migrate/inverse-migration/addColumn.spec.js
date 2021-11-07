import InverseMigration from 'src/migrate/inverse-migration'
import db from 'src/db'

let migrate = new InverseMigration()

describe('InverseMigration#addColumn', () => {
  it ('calls dropColumn', async () => {
    const spy = posess(db, 'dropColumn').returning({})

    await migrate.addColumn('users', 'email', 'text', {})
    expect(spy).toHaveBeenCalledWith('users')
  })
})
