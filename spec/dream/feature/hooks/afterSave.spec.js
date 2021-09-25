import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('Dream hooks: beforeSave', () => {
  class User extends Dream {
    initialize() {
      this.afterSave(() => {
        this.originalFavoriteIceCreamFlavor = 'chocolate'
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
    })

    await db.createTable('users', t => {
      t.string('email')
      t.string('favorite_ice_cream_flavor')
      t.string('original_favorite_ice_cream_flavor')
    })
    await db.insert('users', { email: 'fishman', favorite_ice_cream_flavor: 'chocolate' })
  })

  it ('runs prior to saving', async () => {
    const user = await User.first()
    user.favorite_ice_cream_flavor = 'cherry'

    expect(user.originalFavoriteIceCreamFlavor).toBe(undefined)
    await user.save()
    expect(user.originalFavoriteIceCreamFlavor).toBe('chocolate')
  })
})
