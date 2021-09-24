import db from 'src/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'

describe('association: HasOneThrough belongsTo', () => {
  class User extends Dream {
    initialize() {
      this
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id' })
        .hasOne('dessert_time', { foreignKey: 'user_id' })
    }
  }

  class FavoriteIceCream extends Dream {
    initialize() {
      this
        .belongsTo('user', { primaryKey: 'user_id' })
        .hasOne('favorite_topping', { foreignKey: 'favorite_ice_cream_id' })
        .hasOne('dessert_time', { through: 'user' })
    }
  }

  class DessertTime extends Dream {
    initialize() {
      this
        .belongsTo('user', { primaryKey: 'user_id' })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'user': User,
      'favorite_ice_cream': FavoriteIceCream,
      'dessert_time': DessertTime,
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
      dessert_times: {
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
        time: {
          type: 'string',
          name: 'time',
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
    await db.createTable('dessert_times', t => {
      t.int('user_id')
      t.string('time')
    })
    await db.insert('users', { email: 'fishman' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
    await db.insert('dessert_times', { time: 'noon', user_id: 1 })
  })

  it ('joins two records', async () => {
    const iceCream = await FavoriteIceCream.first()
    const dessertTime = await iceCream.dessertTime()
    expect(dessertTime.constructor.name).toBe('DessertTime')
    expect(dessertTime.userId).toBe(1)
    expect(dessertTime.time).toBe('noon')
  })
})
