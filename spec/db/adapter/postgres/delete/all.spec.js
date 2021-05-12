import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#delete#all', () => {
  it ('performs delete query', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    const rows = await postgres.delete('users')
    expect(rows.length).toBe(0)

    const results = await postgres.count('users')
    expect(results).toBe(0)
  })
})

