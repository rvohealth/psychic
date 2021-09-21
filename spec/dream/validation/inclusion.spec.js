import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import InclusionCheckFailed from 'src/error/dream/validation/inclusion-check-failed'

describe('Dream#validates inclusion', () => {
  class TestUser extends Dream {
    initialize() {
      this
        .validates('mood', { inclusion: ['sassy', 'crabby'] })
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

  it ('permits included values', async () => {
    let error = null
    try {
      await TestUser.create({ mood: 'sassy' })
    } catch (e) {
      error = e
    }
    expect(error).toBe(null)
  })

  it ('prevents non-unique values', async () => {
    let error = null
    try {
      await TestUser.create({ mood: 'happy' })
    } catch (e) {
      error = e
    }

    expect(error?.constructor).toBe(InclusionCheckFailed)
  })
})
