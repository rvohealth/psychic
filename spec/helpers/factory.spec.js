import Factory from 'src/helpers/factory'
import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'

class User extends Dream {}
beforeEach(async () => {
  await db.createTable('users', t => {
    t.string('email')
  })

  const mockSchema = {
    users: {
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
    }
  }

  jest.spyOn(config, 'schema', 'get').mockReturnValue(mockSchema)
})

describe ('Factory', () => {
  beforeEach(() => {
    Factory.boot({
      user: User,
    })
  })

  describe ('#create', () => {
    it ('creates a new dream in db', async () => {
      const user = await Factory.create('user', { email: 'fishman' })
      expect(user.constructor).toBe(User)
      expect(user.persisted).toBe(true)
    })
  })
})
