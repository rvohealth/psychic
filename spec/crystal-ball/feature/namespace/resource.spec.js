import CrystalBall from 'src/crystal-ball'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/singletons/config'

describe('Namespace#resource', () => {
  class TestUser extends Dream {
  }

  class TestUsersChannel extends Channel {
  }

  beforeEach(() => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'test_user': TestUser,
    })

    jest.spyOn(config, 'channels', 'get').mockReturnValue({
      'TestUsers': { default: TestUsersChannel },
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
        password: {
          type: 'string',
          name: 'password',
        },
        password_digest: {
          type: 'string',
          name: 'password_digest',
        },
      }
    })
  })

  it ('sets up create, put, patch, show, index, delete routes', async () => {
    jest.spyOn(config, 'routeCB', 'get').mockReturnValue(r => {
      r.resource('test-users')
    })

    expect(CrystalBall.routes.length).toBe(6)
    expect(CrystalBall.routes.find(r => r.route === 'test-users' && r.httpMethod === 'get').isResource).toBe(true)
    expect(CrystalBall.routes.find(r => r.route === 'test-users' && r.httpMethod === 'post').isResource).toBe(true)
    expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'get').isResource).toBe(true)
    expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'put').isResource).toBe(true)
    expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'patch').isResource).toBe(true)
    expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'delete').isResource).toBe(true)
  })

  describe ('when only is passed', () => {
    it ('limits routes to the allowlist passed', () => {
      jest.spyOn(config, 'routeCB', 'get').mockReturnValue(r => {
        r.resource('test-users', { only: ['create', 'update'] })
      })

      expect(CrystalBall.routes.length).toBe(3)
      expect(CrystalBall.routes.find(r => r.route === 'test-users' && r.httpMethod === 'post').isResource).toBe(true)
      expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'put').isResource).toBe(true)
      expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'patch').isResource).toBe(true)
    })
  })

  describe ('when except is passed', () => {
    it ('limits routes to subtract the denylist passed', () => {
      jest.spyOn(config, 'routeCB', 'get').mockReturnValue(r => {
        r.resource('test-users', { except: ['create', 'update'] })
      })

      expect(CrystalBall.routes.length).toBe(3)
      expect(CrystalBall.routes.find(r => r.route === 'test-users' && r.httpMethod === 'get').isResource).toBe(true)
      expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'get').isResource).toBe(true)
      expect(CrystalBall.routes.find(r => r.route === 'test-users/:id' && r.httpMethod === 'delete').isResource).toBe(true)
    })
  })

  describe ('when a callback is passed', () => {
    it ('calls callback, applying all routes as additional methods to resource', () => {
      jest.spyOn(config, 'routeCB', 'get').mockReturnValue(r => {
        r.resource('test-users', { only: ['create'] }, () => {
          r.post('fishmen', 'test-users#fishmen')
        })
      })

      expect(CrystalBall.routes.length).toBe(2)
      expect(CrystalBall.routes.find(r => r.route === 'test-users' && r.httpMethod === 'post').isResource).toBe(true)
      expect(CrystalBall.routes.find(r => r.route === 'test-users/fishmen' && r.httpMethod === 'post')).not.toBeNull()
    })
  })
})

