import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#update with where', () => {
  it ('respects where clause', async () => {
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

    const rows = await postgres.update('test_users', { email: 'jammin' }, { where: { email: 'james' }})
    expect(rows.length).toBe(1)

    const results = await postgres.select(['email'], { from: 'test_users', where: { email: 'jammin' } })
    expect(results.length).toBe(1)
  })
})

