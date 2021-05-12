import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('association: HasManyThrough hasOne', () => {
  class User extends Dream {
    initialize() {
      this
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id' })
        .hasMany('favorite_toppings', { through: 'favorite_ice_cream' })
    }
  }

  class FavoriteIceCream extends Dream {
    initialize() {
      this
        .hasMany('favorite_toppings', { foreignKey: 'favorite_ice_cream_id' })
        .belongsTo('user', { primaryKey: 'user_id' })
    }
  }

  class FavoriteTopping extends Dream {
    initialize() {
      this
        .belongsTo('favorite_ice_cream', { primaryKey: 'favorite_ice_cream_id' })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'user': User,
      'favorite_ice_cream': FavoriteIceCream,
      'favorite_topping': FavoriteTopping,
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
          name: 'flavor',
        },
      },
      favorite_toppings: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        favorite_ice_cream_id: {
          type: 'int',
          name: 'favorite_ice_cream_id',
        },
        flavor: {
          type: 'string',
          name: 'flavor',
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
    await db.createTable('favorite_toppings', t => {
      t.int('favorite_ice_cream_id')
      t.string('flavor')
    })
    await db.insert('users', { email: 'fishman' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
    await db.insert('favorite_toppings', { flavor: 'rainbow sprinkles', favorite_ice_cream_id: 1 })
    await db.insert('favorite_toppings', { flavor: 'chocolate sprinkles', favorite_ice_cream_id: 1 })
  })

  it ('joins two records', async () => {
    const user = await User.first()
    const toppings = await user.favoriteToppings()
    expect(toppings.length).toBe(2)
    expect(toppings.map(t => t.constructor.name).uniq()).toEqual(['FavoriteTopping'])
    expect(toppings.map(t => t.favoriteIceCreamId).uniq()).toEqual([1])
    expect(toppings.map(t => t.flavor)).toEqual(['rainbow sprinkles', 'chocolate sprinkles'])
  })
})
