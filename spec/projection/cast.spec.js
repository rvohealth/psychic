import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'
import Projection from 'src/projection'

describe('Projection#cast', () => {
  class TestUser extends Dream {
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

  describe ('with a projection that has no filters applied', () => {
    class TestUserProjection extends Projection {}

    it ('bundles all attributes and serializes', async () => {
      const user = await TestUser.first()
      const result = new TestUserProjection(user).cast()
      expect(result).toEqual({ id: 1, email: 'fishman' })
    })
  })

  describe ('with a projection that has filters', () => {
    class TestUserProjection extends Projection {
      static attributes = ['email']
    }

    it ('bundles all attributes and serializes', async () => {
      const user = await TestUser.first()
      const result = new TestUserProjection(user).cast()
      expect(result).toEqual({ email: 'fishman' })
    })
  })

  describe ('with a projection that has a custom method defined', () => {
    class TestUserProjection extends Projection {
      static attributes = ['email', 'zimbazoo']

      zimbazoo() {
        return 'zombo'
      }
    }

    it ('bundles all attributes and serializes', async () => {
      const user = await TestUser.first()
      const result = new TestUserProjection(user).cast()
      expect(result).toEqual({ email: 'fishman', zimbazoo: 'zombo' })
    })
  })
})

