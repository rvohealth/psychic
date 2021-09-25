import bcrypt from 'bcrypt'
import { create } from 'spec/factories'

describe('Dream#authenticateFor', () => {
  it ('validates a correct password', async () => {
    const TestUser = create('dream.testUser')
    const dream = new TestUser()
    const spy = posess(bcrypt, 'compare').returning(true)
    dream._authentications.db = {
      'email::password': {
        identifyingColumn: 'email',
        passwordColumn: 'password',
      },
    }
    dream.password_digest = '294gy3u4gr5h3vt'

    const result = await dream.authenticateFor('email', 'p@ssw0rd')
    expect(spy).toHaveBeenCalledWith('p@ssw0rd', '294gy3u4gr5h3vt')
    expect(result).toBe(true)
  })

  context ('with an invalid password', () => {
    it ('returns false', async () => {
      const TestUser = create('dream.testUser')
      const dream = new TestUser()
      const spy = posess(bcrypt, 'compare').returning(false)
      dream._authentications.db = {
        'email::password': {
          identifyingColumn: 'email',
          passwordColumn: 'password',
        },
      }
      dream.password_digest = '294gy3u4gr5h3vt'

      const result = await dream.authenticateFor('email', 'incorrect')
      expect(spy).toHaveBeenCalledWith('incorrect', '294gy3u4gr5h3vt')
      expect(result).toBe(false)
    })
  })
})
