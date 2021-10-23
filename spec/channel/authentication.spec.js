import jwt from 'jsonwebtoken'
import { jest } from '@jest/globals'
import { create } from 'spec/factories'
import Channel from 'src/channel'
import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'

describe('Channel#authenticates', () => {
  it ('leverages associated model to handle authentication', async () => {
    class TestUser extends Dream {
      static {
        TestUser
          .authenticates('email', 'password')
      }
    }

    class TestUserChannel extends Channel {
      initialize() {
        this.authenticates('test-user', { against: 'email:password', as: 'currentUser' })
      }
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
          type: 'text',
          name: 'email',
        },
        password: {
          type: 'text',
          name: 'password',
        },
        password_digest: {
          type: 'text',
          name: 'password_digest',
        },
        otherpassword: {
          type: 'text',
          name: 'password',
        },
        otherpassword_digest: {
          type: 'text',
          name: 'otherpassword_digest',
        },
      }
    })

    jest.spyOn(jwt, 'sign').mockReturnValue('fishman_token')
    jest.spyOn(jwt, 'sign').mockReturnValue('fishman_token')

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('password')
      t.string('password_digest')
      t.string('otherpassword')
      t.string('otherpassword_digest')
    })

    const testUser = new TestUser({ email: 'fishman', password: 'jones', otherpassword: 'simba' })
    await testUser.save()

    const vision = create('crystalBall.vision', 'test-users/auth', 'auth', {
      params: {
        email: 'fishman',
        password: 'jones',
      }
    })
    const channel = new TestUserChannel(vision)

    const jsonSpy = jest.fn()
    const cookieSpy = jest.fn()
    channel.response.json = jsonSpy
    channel.response.cookie = cookieSpy
    await channel.auth()

    expect(jsonSpy).toHaveBeenCalledWith({ token: 'fishman_token' })
    expect(jwt.sign).toHaveBeenCalledWith({ key: 'email:password', id: 1, dreamClass: 'TestUser' }, 'black cats are the coolest')
    expect(cookieSpy).toHaveBeenCalledWith(
      'currentUser',
      'fishman_token',
      {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
      },
    )
  })
})

