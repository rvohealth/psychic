import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with multiple columns', () => {
  it ('applies where conditions', async () => {
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
        name: {
          type: 'string',
          name: 'name',
        },
      }
    })

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('name')
    })
    await postgres.insert('test_users', [{ email: 'james@james', name: 'james mcgilliham' }])
    await postgres.insert('test_users', [{ email: 'fishman@fishman', name: 'fish man' }])

    const results = await postgres.select(['email', 'name'], { from: 'test_users' })
    expect(results.length).toBe(2)
    expect(results[0]).toEqual({ email: 'james@james', name: 'james mcgilliham' })
    expect(results[1]).toEqual({ email: 'fishman@fishman', name: 'fish man' })
  })
})

