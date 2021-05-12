import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with multiple columns', () => {
  it ('applies where conditions', async () => {
    await db.createTable('users', t => {
      t.string('email')
      t.string('name')
    })
    await postgres.insert('users', [{ email: 'james@james', name: 'james mcgilliham' }])
    await postgres.insert('users', [{ email: 'fishman@fishman', name: 'fish man' }])

    const results = await postgres.select(['email', 'name'], { from: 'users' })
    expect(results.length).toBe(2)
    expect(results[0]).toEqual({ email: 'james@james', name: 'james mcgilliham' })
    expect(results[1]).toEqual({ email: 'fishman@fishman', name: 'fish man' })
  })
})

