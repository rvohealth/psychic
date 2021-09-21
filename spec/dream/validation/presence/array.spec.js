import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (array)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('cappuccino_flavors', { presence: true })
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
        cappuccino_flavors: {
          type: 'array',
          name: 'cappuccino_flavors',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.array('cappuccino_flavors', 'text')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ cappuccino_flavors: ['chocolate', 'vanilla', 'diabetes'] })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ cappuccino_flavors: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

