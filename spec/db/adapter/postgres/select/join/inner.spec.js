import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with inner join passed', () => {
  beforeEach(async () => {
    await db.createTable('users', t => {
      t.string('email')
    })
    await postgres.insert('users', [
      { email: 'james' },
      { email: 'fishman' },
      { email: 'johsnberg' }
    ])

    await db.createTable('face_masks', t => {
      t.bool('is_m95')
      t.int('user_id')
    })

    // since ids reset after each test, this is safe
    await postgres.insert('face_masks', [
      { is_m95: true, user_id: 1 },
      { is_m95: false, user_id: 2 },
      { is_m95: true, user_id: 3 },
    ])
  })

  it ('applies innner join', async () => {
    const results = await postgres.select(['users.id', 'face_masks.is_m95'], {
      from: 'users',
      join: [{
        table: 'face_masks',
        on: 'face_masks.user_id = users.id',
        type: 'inner',
      }],
    })
    expect(results).toEqual([
      { id: 1, is_m95: true },
      { id: 2, is_m95: false },
      { id: 3, is_m95: true },
    ])
  })

  describe ('when inner join type is not passed', () => {
    it ('defaults to inner join type', async () => {
      const results = await postgres.select(['users.id', 'face_masks.is_m95'], {
        from: 'users',
        join: [{
          table: 'face_masks',
          on: 'face_masks.user_id = users.id',
        }],
      })
      expect(results).toEqual([
        { id: 1, is_m95: true },
        { id: 2, is_m95: false },
        { id: 3, is_m95: true },
      ])
    })
  })
})
