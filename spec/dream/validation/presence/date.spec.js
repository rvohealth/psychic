import db from 'src/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (date)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('signed_up_on', { presence: true })
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
        signed_up_on: {
          type: 'date',
          name: 'signed_up_on',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.date('signed_up_on')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ signed_up_on: now() })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ favorite_letter: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

