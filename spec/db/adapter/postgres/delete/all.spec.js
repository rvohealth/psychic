import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#delete#all', () => {
  it ('performs delete query', async () => {
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

    const rows = await postgres.delete('test_users')
    expect(rows.length).toBe(0)

    const results = await postgres.count('test_users')
    expect(results).toBe(0)
  })
})

