import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (varchar)', () => {
  class TestUser extends Dream {
    static {
      TestUser
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
          type: 'varchar',
          name: 'favorite_letter',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.varchar('favorite_letter')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ favorite_letter: 'zez' })
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

