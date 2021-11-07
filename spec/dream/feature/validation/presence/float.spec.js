import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (float)', () => {
  class TestUser extends Dream {
    static {
      TestUser
        .validates('number', { presence: true })
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
        number: {
          type: 'float',
          length: 2,
          name: 'number',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.float('number')
    })
  })

  it ('permits valid value', async () => {
    let error = null
    try {
      await TestUser.create({ number: 1.2 })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents permits 0 as value', async () => {
    let error = null
    try {
      await TestUser.create({ number: 0 })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ number: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

