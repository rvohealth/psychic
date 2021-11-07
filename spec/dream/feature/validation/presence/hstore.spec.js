import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (hstore)', () => {
  class TestUser extends Dream {
    static {
      TestUser
        .validates('config', { presence: true })
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
        config: {
          type: 'hstore',
          name: 'config',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.hstore('config')
    })
  })

  it.skip ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ config: { fish: 10 } })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it.skip ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ favorite_letter: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

