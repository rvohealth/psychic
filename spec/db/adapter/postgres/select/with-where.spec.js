import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with where passed', () => {
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
      }
    })

    await db.createTable('test_users', t => {
      t.string('email')
    })
    await postgres.insert('test_users', [{ email: 'james' }])
    await postgres.insert('test_users', [{ email: 'fishman' }])

    const results = await postgres.select(['*'], { from: 'test_users', where: { email: 'james' } })
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(1)
    expect(results[0].email).toBe('james')
  })
})

