import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (bool)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('likes_cappuccinos', { presence: true })
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
        likes_cappuccinos: {
          type: 'boolean',
          name: 'likes_cappuccinos',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.bool('likes_cappuccinos')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ likes_cappuccinos: true })
      await TestUser.create({ likes_cappuccinos: false })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ likes_cappuccinos: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

