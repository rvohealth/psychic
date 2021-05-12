import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#changeDefault', () => {
  it ('changes default for column', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'fishman' }])

    expect(await postgres.columnDefault('users', 'email')).toBe(null)
    await postgres.changeDefault('users', 'email', 'tacos')
    expect(await postgres.columnDefault('users', 'email')).toBe("'tacos'::text")
  })
})

