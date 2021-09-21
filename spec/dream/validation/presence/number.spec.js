import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (number)', () => {
  class TestUser extends Dream {
    initialize() {
      this
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
          type: 'int',
          name: 'email',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.int('number')
    })
  })

  it ('permits valid value', async () => {
    let error = null
    try {
      await TestUser.create({ number: 1 })
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

