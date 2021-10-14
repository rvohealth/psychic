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

  posess(config, 'schema', 'get').returning(mockSchema)
})

describe ('Factory', () => {
  beforeEach(() => {
    Factory.boot({
      user: {
        default: User,
      }
    })
  })

  describe ('#create', () => {
    it ('creates a new dream in db', async () => {
      const user = await Factory.create('user', { email: 'fishman' })
      expect(user.constructor).toBe(User)
      expect(user.email).toBe('fishman')
      expect(user.persisted).toBe(true)
    })
  })

  describe ('#build', () => {
    it ('returns a new, non-persisted instance of the dream', async () => {
      const user = await Factory.build('user', { email: 'fishman' })
      expect(user.constructor).toBe(User)
      expect(user.email).toBe('fishman')
      expect(user.persisted).toBe(false)
    })
  })
})
