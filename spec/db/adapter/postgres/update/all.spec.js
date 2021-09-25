import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#update#all', () => {
  it ('performs update query, passing updates to attributes', async () => {
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

    const rows = await postgres.update('test_users', { email: 'jammin' })
    expect(rows.length).toBe(2)

    const results = await postgres.select(['email'], { from: 'test_users', where: { email: 'jammin' } })
    expect(results.length).toBe(2)
  })
})

