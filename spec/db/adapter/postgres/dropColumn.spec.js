import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#dropColumn', () => {
  it ('drops column from table', async () => {
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
    await postgres.insert('test_users', [{ email: 'fishman' }])

    expect(await postgres.hasColumn('test_users', 'email')).toBe(true)
    await postgres.dropColumn('test_users', 'email')
    expect(await postgres.hasColumn('test_users', 'email')).toBe(false)
  })
})

