import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with count passed', () => {
  it ('counts results, returning int', async () => {
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

    const results = await postgres.select(['count(*)'], { from: 'test_users' })
    expect(results).toBe(3)
    // expect(results.length).toBe(3)
    // expect(results[0].email).toBe('james')
    // expect(results[1].email).toBe('fishman')
  })
})
