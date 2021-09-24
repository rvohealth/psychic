import PostgresAdapter from 'src/db/adapter/postgres'
import db from 'src/db'
import config from 'src/singletons/config'

let postgres = new PostgresAdapter()

describe('PostgresAdapter#db#select with left outer join passed', () => {
  beforeEach(async () => {
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
      },
      face_masks: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        test_user_id: {
          type: 'int',
          name: 'test_user_id',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.string('email')
    })
    await postgres.insert('test_users', [
      { email: 'james' },
      { email: 'fishman' },
      { email: 'johsnberg' }
    ])

    await db.createTable('face_masks', t => {
      t.bool('is_m95')
      t.int('test_user_id')
    })

    // since ids reset after each test, this is safe
    await postgres.insert('face_masks', [
      { is_m95: true, test_user_id: 1 },
      { is_m95: false, test_user_id: 2 },
      { is_m95: true, test_user_id: 3 },
    ])
  })

  it ('applies left outer join', async () => {
    const results = await postgres.select(['*'], {
      from: 'test_users',
      join: [{
        table: 'face_masks',
        on: 'face_masks.test_user_id = test_users.id',
        type: 'left outer',
      }],
    })
    expect(results).toEqual([
      { id: 1, email: 'james', is_m95: true, test_user_id: 1 },
      { id: 2, email: 'fishman', is_m95: false, test_user_id: 2 },
      { id: 3, email: 'johsnberg', is_m95: true, test_user_id: 3 }
    ])
  })
})
