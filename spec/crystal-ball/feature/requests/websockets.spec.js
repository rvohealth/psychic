import { jest } from '@jest/globals'
import CrystalBall from 'src/crystal-ball'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/singletons/config'
import db from 'src/db'

import { emit } from 'spec/helpers/request'
const spy = jest.fn()

describe('CrystalBall Websockets', () => {
  class TestUser extends Dream {
  }

  class TestUsersChannel extends Channel {
    zimbo() {
      spy(this.params)
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
      r.resource('test-users', { only: [] }, () => {
        r.ws('zimbo', 'test-users#zimbo')
      })
    })

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('secret')
      t.string('secret_digest')
    })
    await TestUser.create({ email: 'fishman', secret: 'zim' })
  })

  it ('allows ws request', async () => {
    const crystalBall = new CrystalBall()
    await crystalBall.gaze()
    await emit('test-users/zimbo', { fish: 10 })
    expect(spy).toHaveBeenCalledWith({ fish: 10 })
  })
})

