import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import PresenceCheckFailed from 'src/error/dream/validation/presence-check-failed'

describe('Dream#validates presence (uuid)', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('cappuccino_id', { presence: true })
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
        cappuccino_id: {
          type: 'uuid',
          name: 'cappuccino_id',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.uuid('cappuccino_id')
    })
  })

  it ('permits valid values', async () => {
    let error = null
    try {
      await TestUser.create({ cappuccino_id: uuid() })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents saving null value', async () => {
    let error = null
    try {
      await TestUser.create({ cappuccino_id: null })
    } catch (e) {
      error = e
    }
    expect(error.constructor).toBe(PresenceCheckFailed)
  })
})

