import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#renameColumn', () => {
  it ('renames column', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'fishman' }])

    expect(await postgres.hasColumn('users', 'email')).toBe(true)
    expect(await postgres.hasColumn('users', 'tacos')).toBe(false)
    await postgres.renameColumn('users', 'email', 'tacos')
    expect(await postgres.hasColumn('users', 'email')).toBe(false)
    expect(await postgres.hasColumn('users', 'tacos')).toBe(true)
  })
})

