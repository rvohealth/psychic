import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with limit passed', () => {
  beforeEach(() => {
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
  })

  it ('applies where conditions', async () => {
    await db.createTable('test_users', t => {
      t.string('email')
    })
    await postgres.insert('test_users', [{ email: 'james' }])
    await postgres.insert('test_users', [{ email: 'fishman' }])

    const results = await postgres.select(['*'], { from: 'test_users', limit: 1 })
    expect(results.length).toBe(1)
    expect(results[0].id).toBe(1)
    expect(results[0].email).toBe('james')
  })

  describe ('with order passed', () => {
    it ('adheres to order', async () => {
      await db.createTable('test_users', t => {
        t.string('email')
      })
      await postgres.insert('test_users', [{ email: 'a' }])
      await postgres.insert('test_users', [{ email: 'b' }])

      const results = await postgres.select(['*'], { from: 'test_users', order: [['email', 'desc']], limit: 1 })
      expect(results.length).toBe(1)
      expect(results[0].id).toBe(2)
      expect(results[0].email).toBe('b')
    })
  })
})
