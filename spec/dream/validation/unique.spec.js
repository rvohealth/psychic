import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import UniqueCheckFailed from 'src/error/dream/validation/unique-check-failed'

describe('Dream#validates unique', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('email', { unique: true })
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
        email: {
          type: 'text',
          name: 'email',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.string('email')
    })
  })

  it ('permits unique values', async () => {
    let error = null
    try {
      await TestUser.create({ email: 'fishman' })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents non-unique values', async () => {
    await TestUser.create({ email: 'fishman' })

    let error = null
    try {
      await TestUser.create({ email: 'fishman' })
    } catch (e) {
      error = e
    }

    expect(error?.constructor).toBe(UniqueCheckFailed)
  })
})
