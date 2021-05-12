import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with offset passed', () => {
  it ('applies offset', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'c' }])
    await postgres.insert('users', [{ email: 'b' }])
    await postgres.insert('users', [{ email: 'a' }])

    const results = await postgres.select(['*'], { from: 'users', offset: 2, limit: 1, order: ['email'] })
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(1)
    expect(results[0].email).toBe('c')
  })
})
