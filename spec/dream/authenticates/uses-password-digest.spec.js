import { jest } from '@jest/globals'
import Dream from 'src/dream'
import config from 'src/singletons/config'
import db from 'src/db'

describe('Dream.columns', () => {
  it ("validates the users password against an auto-calculated digest", async () => {
    class TestUser extends Dream {
      initialize() {
        this
          .authenticates('email', 'password')
          .authenticates('email', 'otherpassword')
      }
    }

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

    await db.createTable('test_users', t => {
      t.string('email')
      t.string('password')
      t.string('password_digest')
      t.string('otherpassword')
      t.string('otherpassword_digest')
    })

    const testUser = new TestUser({ email: 'fishman', password: 'jones', otherpassword: 'simba' })
    await testUser.save()

    expect(await testUser.authenticate('email', 'jones')).toBe(true)
    expect(await testUser.authenticate('email', 'simba')).toBe(true)
    expect(await testUser.authenticate('email', 'jonez')).toBe(false)

    // shorthands for simple, single-field auth cases.
    expect(await testUser.authenticate('jones')).toBe(true)
    expect(await testUser.authenticate('simba')).toBe(true)
    expect(await testUser.authenticate('jonez')).toBe(false)
  })
})

