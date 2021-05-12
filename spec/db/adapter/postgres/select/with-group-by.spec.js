import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with group by passed', () => {
  it ('groups results by passed parameters', async () => {
    await db.createTable('users', t => {
      t.string('email')
      t.int('age')
    })
    await postgres.insert('users', [{ email: 'a', age: 26 }])
    await postgres.insert('users', [{ email: 'b', age: 26 }])
    await postgres.insert('users', [{ email: 'c', age: 37 }])

    const results = await postgres.select(['age', 'count(*)'], { from: 'users', group: ['age'] })
    expect(results[0].age).toBe(26)
    expect(results[0].count).toBe('2')
    expect(results[1].age).toBe(37)
    expect(results[1].count).toBe('1')
  })
})
