import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with order passed as an array', () => {
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

  it ('applies order', async () => {
    await db.createTable('test_users', t => {
      t.string('email')
    })
    await postgres.insert('test_users', [{ email: 'b' }])
    await postgres.insert('test_users', [{ email: 'c' }])
    await postgres.insert('test_users', [{ email: 'a' }])

    const results = await postgres.select(['email'], { from: 'test_users', order: [['email']] })
    expect(results.length).toBe(3)
    expect(results[0].email).toBe('a')
    expect(results[1].email).toBe('b')
    expect(results[2].email).toBe('c')
  })

  describe ('with multiple orders passed', () => {
    it ('applies orders correctly', async () => {
      await db.createTable('test_users', t => {
        t.string('first')
        t.string('last')
      })
      await postgres.insert('test_users', [{ first: 'c', last: 'c' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'bc' }])
      await postgres.insert('test_users', [{ first: 'a', last: 'a' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'bb' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'ba' }])

      const results = await postgres.select(['first', 'last'], { from: 'test_users', order: [['first'], ['last']] })
      expect(results.length).toEqual(5)
      expect(results[0]).toEqual({ first: 'a', last: 'a' })
      expect(results[1]).toEqual({ first: 'b', last: 'ba' })
      expect(results[2]).toEqual({ first: 'b', last: 'bb' })
      expect(results[3]).toEqual({ first: 'b', last: 'bc' })
      expect(results[4]).toEqual({ first: 'c', last: 'c' })
    })
  })

  describe ('with multiple direction reversed', () => {
    it ('applies orders correctly', async () => {
      await db.createTable('test_users', t => {
        t.string('first')
        t.string('last')
      })
      await postgres.insert('test_users', [{ first: 'c', last: 'c' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'bc' }])
      await postgres.insert('test_users', [{ first: 'a', last: 'a' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'bb' }])
      await postgres.insert('test_users', [{ first: 'b', last: 'ba' }])

      const results = await postgres.select(['first', 'last'], { from: 'test_users', order: [['first', 'desc'], ['last', 'asc']] })
      expect(results.length).toEqual(5)
      expect(results[0]).toEqual({ first: 'c', last: 'c' })
      expect(results[1]).toEqual({ first: 'b', last: 'ba' })
      expect(results[2]).toEqual({ first: 'b', last: 'bb' })
      expect(results[3]).toEqual({ first: 'b', last: 'bc' })
      expect(results[4]).toEqual({ first: 'a', last: 'a' })
    })
  })
})

