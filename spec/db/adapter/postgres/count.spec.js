import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#count', () => {
  it ('correctly counts table in various states', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })

    expect(await postgres.count('users')).toBe(0)
    await postgres.insert('users', [{ email: 'james' }])
    expect(await postgres.count('users')).toBe(1)
  })
})

