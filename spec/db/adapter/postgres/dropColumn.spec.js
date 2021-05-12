import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#dropColumn', () => {
  it ('drops column from table', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'fishman' }])

    expect(await postgres.hasColumn('users', 'email')).toBe(true)
    await postgres.dropColumn('users', 'email')
    expect(await postgres.hasColumn('users', 'email')).toBe(false)
  })
})

