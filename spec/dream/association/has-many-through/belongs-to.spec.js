import db from 'src/singletons/db'
import config from 'src/singletons/config'
import Dream from 'src/dream'

describe('association: HasManyThrough belongsTo', () => {
  class User extends Dream {
    initialize() {
      this
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id' })
        .hasMany('dessert_times', { foreignKey: 'user_id' })
    }
  }

  class FavoriteIceCream extends Dream {
    initialize() {
      this
        .belongsTo('user', { primaryKey: 'user_id' })
        .hasOne('favorite_topping', { foreignKey: 'favorite_ice_cream_id' })
        .hasMany('dessert_times', { through: 'user' })
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
    await db.insert('dessert_times', { time: 'fivepm', user_id: 1 })
  })

  it ('joins two records', async () => {
    const iceCream = await FavoriteIceCream.first()
    const dessertTimes = await iceCream.dessertTimes()
    expect(dessertTimes.length).toBe(2)
    expect(dessertTimes.map(d => d.constructor.name).uniq()).toEqual(['DessertTime'])
    expect(dessertTimes.map(d => d.userId).uniq()).toEqual([1])
    expect(dessertTimes.map(d => d.time)).toEqual(['noon', 'fivepm'])
  })
})
