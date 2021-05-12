import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with left outer join passed', () => {
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
      { is_m95: true, user_id: 4 },
    ])
  })

  it ('applies right outer join', async () => {
    const results = await postgres.select(['*'], {
      from: 'users',
      join: [{
        table: 'face_masks',
        on: 'face_masks.user_id = users.id',
        type: 'right outer',
      }],
    })
    expect(results).toEqual([
      { id: 1, email: 'james', is_m95: true, user_id: 1 },
      { id: 2, email: 'fishman', is_m95: false, user_id: 2 },
      { id: 3, email: 'johsnberg', is_m95: true, user_id: 3 },
      { id: 4, email: null, is_m95: true, user_id: 4 },
    ])
  })
})
