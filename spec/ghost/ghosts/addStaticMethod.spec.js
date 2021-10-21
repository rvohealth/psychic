import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import ghosts from 'src/ghost/ghosts'

describe('Ghosts#addStaticMethod', () => {
  class TestUser extends Dream {
  }

  beforeEach(async () => {
    posess(config, 'dreams', 'get').returning({
      'test_user': TestUser,
    })

    posess(config, 'schema', 'get').returning({
      test_users: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        email: {
          type: 'string',
          name: 'email',
        },
      },
    })

    await db.createTable('test_users', t => {
      t.string('email')
    })
    await db.insert('test_users', { email: 'fishman' })
  })

  it ('calls static method in bg', async () => {
    const addSpy = eavesdrop()
    const queueSpy = posess(ghosts, 'queue').returning({ add: addSpy })

    ghosts.addStaticMethod(TestUser, 'create', { email: 'james' })

    expect(queueSpy).toHaveBeenCalledWith('static', true)
    expect(addSpy).toHaveBeenCalledWith({
      klass: TestUser,
      methodName: 'create',
      args: [{ email: 'james' }],
    })
  })

  // since difficult to test redis in test enviornment, testing private method here
  // and also testing that correct data is passed in corresponding public method (above)
  describe('Ghosts#_processStaticMethod', () => {
    it ('identifies and runs the method on the corresponding dream class', async () => {
      const doneSpy = eavesdrop()
      const createSpy = posess(TestUser, 'create').returning(true)
      const job = {
        data: {
          klass: TestUser,
          methodName: 'create',
          args: [{ email: 'james' }],
        }
      }

      await ghosts._processStaticMethod(job, doneSpy)

      expect(createSpy).toHaveBeenCalledWith({ email: 'james' })
      expect(doneSpy).toHaveBeenCalled()
    })
  })
})

