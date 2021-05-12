import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select#all', () => {
  it ('runs create database sql, passing db name', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'james' }])
    await postgres.insert('users', [{ email: 'fishman' }])

    const results = await postgres.select(['*'], { from: 'users' })
    expect(results[0].id).toBe(1)
    expect(results[0].email).toBe('james')
    expect(results[1].id).toBe(2)
    expect(results[1].email).toBe('fishman')
  })
})

