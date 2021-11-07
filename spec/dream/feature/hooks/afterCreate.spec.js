import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('Dream hooks: afterCreate', () => {
  class User extends Dream {
    static {
      User
        .afterCreate('setOriginalFlavor')
    }

    setOriginalFlavor() {
      this.originalFavoriteIceCreamFlavor = 'chocolate'
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
  })

  it ('runs after saving', async () => {
    const user = await User.create({ favoriteIceCreamFlavor: 'cherry' })
    expect(user.originalFavoriteIceCreamFlavor).toBe('chocolate')
  })
})
