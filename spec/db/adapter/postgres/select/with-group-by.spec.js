import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with group by passed', () => {
  it ('groups results by passed parameters', async () => {
    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      test_users: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        email: {
          type: 'string',
          name: 'email',
        },
        age: {
          type: 'int',
          name: 'age',
        },
      }
    })

    await db.createTable('test_users', t => {
      t.string('email')
      t.int('age')
    })
    await postgres.insert('test_users', [{ email: 'a', age: 26 }])
    await postgres.insert('test_users', [{ email: 'b', age: 26 }])
    await postgres.insert('test_users', [{ email: 'c', age: 37 }])

    const results = await postgres.select(['age', 'count(*)'], { from: 'test_users', group: ['age'] })
    expect(results[0].age).toBe(26)
    expect(results[0].count).toBe('2')
    expect(results[1].age).toBe(37)
    expect(results[1].count).toBe('1')
  })
})
