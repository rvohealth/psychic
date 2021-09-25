import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (timestamp)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('liked_cappuccinos_at', { presence: true })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'test_user': TestUser,
    })

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      test_users: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        liked_cappuccinos_at: {
          type: 'timestamp',
          name: 'liked_cappuccinos_at',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.timestamp('liked_cappuccinos_at')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ liked_cappuccinos_at: 1 .minute.ago })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ liked_cappuccinos_at: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

