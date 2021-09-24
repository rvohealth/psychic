import db from 'src/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'

describe('association: HasMany', () => {
  class User extends Dream {
    initialize() {
      this.hasMany('favorite_ice_creams', { foreignKey: 'user_id' })
    }
  }

  class FavoriteIceCream extends Dream {
    initialize() {
      this.belongsTo('user', { primaryKey: 'user_id' })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'user': User,
      'favorite_ice_cream': FavoriteIceCream,
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
      favorite_ice_creams: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        user_id: {
          type: 'int',
          name: 'user_id',
        },
        flavor: {
          type: 'string',
          name: 'email',
        },
      }
    })

    await db.createTable('users', t => {
      t.string('email')
    })
    await db.createTable('favorite_ice_creams', t => {
      t.int('user_id')
      t.string('flavor')
    })
    await db.insert('users', { email: 'fishman' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
  })

  it ('joins two records', async () => {
    const user = await User.first()
    const iceCreams = await user.favoriteIceCreams()
    expect(iceCreams.length).toBe(1)
    expect(iceCreams[0].userId).toBe(1)
  })
})
