import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#count', () => {
  it ('correctly counts table in various states', async () => {
    await db.createTable('test_users', t => {
      t.string('email')
    })

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
        secret: {
          type: 'string',
          name: 'secret',
        },
      }
    })


    expect(await postgres.count('test_users')).toBe(0)
    await postgres.insert('test_users', [{ email: 'james' }])
    expect(await postgres.count('test_users')).toBe(1)
  })
})

