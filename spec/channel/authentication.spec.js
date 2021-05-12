import jwt from 'jsonwebtoken'
import { jest } from '@jest/globals'
import { create } from 'spec/factories'
import Channel from 'src/channel'
import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'

describe('Channel#authenticates', () => {
  it ("leverages associated model to handle authentication", async () => {
    class TestUser extends Dream {
      initialize() {
        this.authenticates('email', 'password')
      }
    }

    class TestUserChannel extends Channel {
      initialize() {
        this.authenticates('test-user', { against: 'email' })
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

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('password')
      t.string('password_digest')
      t.string('otherpassword')
      t.string('otherpassword_digest')
    })

    const testUser = new TestUser({ email: 'fishman', password: 'jones', otherpassword: 'simba' })
    await testUser.save()

    const vision = create('crystalBall.vision', 'test-users/sign-in', 'signIn', {
      params: {
        email: 'fishman',
        password: 'jones',
      }
    })
    const channel = new TestUserChannel(vision)

    const spy = jest.fn()
    channel.response.json = spy
    await channel.signIn()

    expect(spy).toHaveBeenCalledWith({ token: 'fishman_token' })
    expect(jwt.sign).toHaveBeenCalledWith({ identifyingColumn: 'email', id: 1 }, 'black cats are the coolest')
  })
})

