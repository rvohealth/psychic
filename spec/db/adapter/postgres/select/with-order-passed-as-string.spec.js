import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with order passed', () => {
  it ('applies order', async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [{ email: 'b' }])
    await postgres.insert('users', [{ email: 'c' }])
    await postgres.insert('users', [{ email: 'a' }])

    const results = await postgres.select(['email'], { from: 'users', order: ['email'] })
    expect(results.length).toBe(3)
    expect(results[0].email).toBe('a')
    expect(results[1].email).toBe('b')
    expect(results[2].email).toBe('c')
  })

  describe ('with multiple orders passed', () => {
    it ('applies orders correctly', async () => {
      await db.createTable('users', t => {
        t.string('first')
        t.string('last')
      })
      await postgres.insert('users', [{ first: 'c', last: 'c' }])
      await postgres.insert('users', [{ first: 'b', last: 'bc' }])
      await postgres.insert('users', [{ first: 'a', last: 'a' }])
      await postgres.insert('users', [{ first: 'b', last: 'bb' }])
      await postgres.insert('users', [{ first: 'b', last: 'ba' }])

      const results = await postgres.select(['first', 'last'], { from: 'users', order: ['first', 'last'] })
      expect(results.length).toEqual(5)
      expect(results[0]).toEqual({ first: 'a', last: 'a' })
      expect(results[1]).toEqual({ first: 'b', last: 'ba' })
      expect(results[2]).toEqual({ first: 'b', last: 'bb' })
      expect(results[3]).toEqual({ first: 'b', last: 'bc' })
      expect(results[4]).toEqual({ first: 'c', last: 'c' })
    })
  })
})

