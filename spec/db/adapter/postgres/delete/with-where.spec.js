import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#delete with where', () => {
  it ('respects where clause', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    await postgres.delete('users', { where: { email: 'james' }})

    const results = await postgres.count('users')
    expect(results).toBe(1)
  })
})

