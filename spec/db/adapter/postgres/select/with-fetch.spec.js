import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with fetch passed', () => {
  it ('limits results, much like passing limit', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])
    await postgres.insert('users', [{ email: 'johsnberg' }])

    const results = await postgres.select(['*'], { from: 'users', fetch: 2 })
    expect(results.length).toBe(2)
    expect(results[0].email).toBe('james')
    expect(results[1].email).toBe('fishman')
  })
})
