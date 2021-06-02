import CrystalBall from 'src/crystal-ball'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/config'

describe('Namespace#authenticates', () => {
  class TestUser extends Dream {
  }

  class TestUsersChannel extends Channel {
  }

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

  it ('adds auth route to namespace', async () => {
    jest.spyOn(config, 'routeCB', 'get').mockReturnValue(cr => {
      jest.spyOn(config, 'channels', 'get').mockReturnValue({
        'TestUsers': { default: TestUsersChannel },
      })

      cr.resource('test-users', { only: 'create' }, testUsers => {
        testUsers.auth('currentUser')
      })
    })

    expect(CrystalBall.routes.length).toBe(2)
    expect(CrystalBall.routes.find(r => r.parsed.key === 'test-users' && r.httpMethod === 'post').isResource).toBe(true)
    expect(
      !!CrystalBall.routes.filter(r =>
        r.parsed.key === 'test-users/auth' &&
        r.httpMethod === 'post' &&
        r.authKey === 'currentUser'
      ).length
    ).toBe(true)
  })
})
