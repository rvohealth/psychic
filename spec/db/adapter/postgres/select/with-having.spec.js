import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with having passed', () => {
  it ('groups results by passed parameters', async () => {
    await db.createTable('users', t => {
      t.string('email')
      t.int('age')
    })
    await postgres.insert('users', [{ email: 'a', age: 26 }])
    await postgres.insert('users', [{ email: 'b', age: 26 }])
    await postgres.insert('users', [{ email: 'c', age: 37 }])

    const results = await postgres.select(['age', 'count(*)'], {
      from: 'users',
      group: ['age'],
      having: 'count(*) > 1',
    })
    expect(results.length).toBe(1)
    expect(results[0].age).toBe(26)
    expect(results[0].count).toBe('2')
  })
})
