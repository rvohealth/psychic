import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#renameColumn', () => {
  it ('renames column', async () => {
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
    expect(await postgres.hasColumn('test_users', 'tacos')).toBe(false)
    await postgres.renameColumn('test_users', 'email', 'tacos')
    expect(await postgres.hasColumn('test_users', 'email')).toBe(false)
    expect(await postgres.hasColumn('test_users', 'tacos')).toBe(true)
  })
})

