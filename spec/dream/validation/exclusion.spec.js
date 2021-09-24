import db from 'src/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import ExclusionCheckFailed from 'src/error/dream/validation/exclusion-check-failed'

describe('Dream#validates inclusion', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('mood', { exclusion: ['sassy', 'crabby'] })
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
        mood: {
          type: 'text',
          name: 'mood',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.string('mood')
    })
  })

  it ('permits non-excluded values', async () => {
    let error = null
    try {
      await TestUser.create({ mood: 'happy' })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents excluded values', async () => {
    let error = null
    try {
      await TestUser.create({ mood: 'sassy' })
    } catch (e) {
      error = e
    }

    expect(error?.constructor).toBe(ExclusionCheckFailed)
  })
})
