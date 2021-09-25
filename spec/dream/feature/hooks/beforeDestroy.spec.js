import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('Dream hooks: beforeDestroy', () => {
  class User extends Dream {
    initialize() {
      this.beforeDestroy(async () => {
        await db.insert('zimbazoos', { nonsense: 'zigloo' })
      })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'user': User,
    })
    jest.spyOn(config, 'schema', 'get').mockReturnValue({
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
      },
      zimbazoos: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        nonsense: {
          type: 'string',
          name: 'nonsense',
        },
      }
    })

    await db.createTable('users', t => {
      t.string('email')
      t.string('favorite_ice_cream_flavor')
      t.string('original_favorite_ice_cream_flavor')
    })
    await db.createTable('zimbazoos', t => {
      t.string('nonsense')
    })
  })

  it ('runs prior to saving', async () => {
    expect(await db.count('zimbazoos').do()).toBe(0)
    const user = await User.create({ favoriteIceCreamFlavor: 'cherry' })
    expect(await User.count()).toBe(1)
    await user.destroy()
    expect(await User.count()).toBe(0)
    expect(await db.count('zimbazoos').do()).toBe(1)
  })
})
