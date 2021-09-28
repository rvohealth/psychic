import CrystalBall from 'src/crystal-ball'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/config'
import db from 'src/db'

import { fetch, post } from 'spec/suppport/helpers/request'

describe('CrystalBall Requests: auth endpoint', () => {
  class TestUser extends Dream {
    initialize() {
      this.authenticates('email', 'secret')
    }
  }

  class TestUsersChannel extends Channel {
    initialize() {
      this.authenticates('test-user', { against: 'email:secret', as: 'currentUser' })
    }

    authtest() {
      this.json({ auth: 'test' })
    }
  }

  beforeEach(async () => {
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
        secret: {
          type: 'string',
          name: 'secret',
        },
        secret_digest: {
          type: 'string',
          name: 'secret_digest',
        },
      }
    })

    jest.spyOn(config, 'routeCB', 'get').mockReturnValue(r => {
      r.resource('test-users', { only: 'create' }, () => {
        r.auth('currentUser')
      })

      r.given('auth:currentUser', () => {
        r.get('authtest', 'test-users#authtest')
      })
    })

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('secret')
      t.string('secret_digest')
    })
    await TestUser.create({ email: 'fishman', secret: 'zim' })
  })

  it ('permits access to otherwise-gated route', async () => {
    const crystalBall = new CrystalBall()
    await crystalBall.gaze()

    let error = null
    try {
      await fetch('authtest')
    } catch(e) {
      error = e
    }

    expect(error.response.status).toBe(401)
    let response = await post('test-users/auth', { email: 'fishman', secret: 'zim' })
    expect(response.status).toBe(200)

    response = await fetch('authtest')
    expect(response.status).toBe(200)

    await crystalBall.closeConnection()
  })

  context ('with invalid credentials', () => {
    it ('returns 401', async () => {
      const crystalBall = new CrystalBall()
      await crystalBall.gaze()

      let error = null
      try {
        await post('test-users/auth', { email: 'fishman', secret: 'zzim' })
      } catch(e) {
        error = e
      }

      expect(error.response.status).toBe(401)
      await crystalBall.closeConnection()
    })
  })
})

