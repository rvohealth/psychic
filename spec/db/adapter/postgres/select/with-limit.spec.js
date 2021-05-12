import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with limit passed', () => {
  it ('applies where conditions', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    const results = await postgres.select(['*'], { from: 'users', limit: 1 })
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(1)
    expect(results[0].email).toBe('james')
  })

  describe ('with order passed', () => {
    it ('adheres to order', async () => {
      await db.createTable('users', t => {
        t.string('email')
      })
      await postgres.insert('users', [{ email: 'a' }])
      await postgres.insert('users', [{ email: 'b' }])

      const results = await postgres.select(['*'], { from: 'users', order: [['email', 'desc']], limit: 1 })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe(2)
      expect(results[0].email).toBe('b')
    })
  })
})
