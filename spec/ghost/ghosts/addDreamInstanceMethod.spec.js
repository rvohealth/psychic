import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import ghosts from 'src/ghost/ghosts'

describe('Ghosts#addDreamInstanceMethod', () => {
  class TestUser extends Dream {
    fishman(...args) {
    }
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
  })

  it ('calls static method in bg', async () => {
    const addSpy = eavesdrop()
    const queueSpy = posess(ghosts, 'queue').returning({ add: addSpy })
    const user = await TestUser.create({ email: 'fishman' })

    ghosts.addDreamInstanceMethod('TestUser', user.id, 'create', { email: 'james' })

    expect(queueSpy).toHaveBeenCalledWith('dream.instance', true)
    expect(addSpy).toHaveBeenCalledWith({
      dreamName: 'TestUser',
      methodName: 'create',
      id: user.id,
      args: [{ email: 'james' }],
    })
  })

  // since difficult to test redis in test enviornment, testing private method here
  // and also testing that correct data is passed in corresponding public method (above)
  describe('Ghosts#_processDreamInstanceMethod', () => {
    it ('identifies and runs the method on the corresponding dream instance', async () => {
      const doneSpy = eavesdrop()
      const fishmanSpy = posess(TestUser.prototype, 'fishman')
      const user = await TestUser.create({ email: 'fishman' })
      const job = {
        data: {
          dreamName: 'TestUser',
          id: user.id,
          methodName: 'fishman',
          args: [{ email: 'james' }],
        }
      }
      await ghosts._processDreamInstanceMethod(job, doneSpy)
      expect(fishmanSpy).toHaveBeenCalledWith({ email: 'james' })
      expect(doneSpy).toHaveBeenCalled()
    })
  })
})

