import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('association: BelongsTo', () => {
  class User extends Dream {
    static {
      User
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id', inverseOf: 'user' })
    }
  }

  class FavoriteIceCream extends Dream {
    static {
      FavoriteIceCream
        .belongsTo('user', { primaryKey: 'user_id', inverseOf: 'favorite_ice_cream' })
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
    const iceCream = await FavoriteIceCream.first()
    const user = await iceCream.user()
    expect(user.constructor.name).toBe('User')
    expect(user.id).toBe(1)
    expect(user.email).toBe('fishman')
  })
})
