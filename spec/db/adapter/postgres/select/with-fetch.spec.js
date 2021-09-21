import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with fetch passed', () => {
  it ('limits results, much like passing limit', async () => {
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
      }
    })

    await db.createTable('test_users', t => {
      t.string('email')
    })
    await postgres.insert('test_users', [{ email: 'james' }])
    await postgres.insert('test_users', [{ email: 'fishman' }])
    await postgres.insert('test_users', [{ email: 'johsnberg' }])

    const results = await postgres.select(['*'], { from: 'test_users', fetch: 2 })
    expect(results.length).toBe(2)
    expect(results[0].email).toBe('james')
    expect(results[1].email).toBe('fishman')
  })
})
