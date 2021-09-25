import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#changeDefault', () => {
  it ('changes default for column', async () => {
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

    expect(await postgres.columnDefault('test_users', 'email')).toBe(null)
    await postgres.changeDefault('test_users', 'email', 'tacos')
    expect(await postgres.columnDefault('test_users', 'email')).toBe("'tacos'::text")
  })
})

