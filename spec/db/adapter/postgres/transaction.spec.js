import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

const postgres = new PostgresAdapter()

describe('PostgresAdapter#db#transaction', () => {
  beforeEach(() => {
    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      users: {
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

  it ('inserts into table', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })

    expect(await postgres.count('users')).toBe(0)
    await postgres.transaction(async () => {
      await postgres.insert('users', [{ email: 'james' }])
    })
    expect(await postgres.count('users')).toBe(1)
  })

  context ('when an error occurs mid-transaction', () => {
    it ('rolls back queries', async () => {
      await db.createTable('users', t => {
        t.string('email')
      })

      expect(await postgres.count('users')).toBe(0)

      let callbackOccured = false
      try {
        await postgres.transaction(async () => {
          await postgres.insert('users', [{ email: 'james' }])
          callbackOccured = true
          throw 'error'
        })
      } catch {
        // ignore
      }

      expect(callbackOccured).toBe(true)
      expect(await postgres.count('users')).toBe(0)
    })
  })
})
