import db from 'src/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (char)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('favorite_letter', { presence: true })
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
        favorite_letter: {
          type: 'char',
          name: 'favorite_letter',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.char('favorite_letter')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ favorite_letter: 'z' })
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

