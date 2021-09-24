import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#update with returning', () => {
  it ('respects returning clause', async () => {
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
      }
    })

    await postgres.insert('test_users', [{ email: 'james' }])
    await postgres.insert('test_users', [{ email: 'fishman' }])

    const results = await postgres.update('test_users', { email: 'jammin' }, { where: { email: 'james' }, returning: ['email']})
    expect(results).toEqual([{email: 'jammin'}])
  })
})

