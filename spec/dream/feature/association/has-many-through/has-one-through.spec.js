import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('association: HasManyThrough hasOneThrough', () => {
  class User extends Dream {
    static {
      User
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id' })
        .hasOne('favorite_topping', { through: 'favorite_ice_cream' })
        .hasMany('topping_nutritional_facts', { through: 'favorite_topping' })
    }
  }

  class FavoriteIceCream extends Dream {
    static {
      FavoriteIceCream
        .hasOne('favorite_topping', { foreignKey: 'favorite_ice_cream_id' })
        .belongsTo('user', { primaryKey: 'user_id' })
    }
  }

  class FavoriteTopping extends Dream {
    static {
      FavoriteTopping
        .belongsTo('favorite_ice_cream', { primaryKey: 'favorite_ice_cream_id' })
        .hasMany('topping_nutritional_facts', { foreignKey: 'favorite_topping_id' })
    }
  }

  class ToppingNutritionalFact extends Dream {
    static {
      ToppingNutritionalFact
        .belongsTo('favorite_topping', { primaryKey: 'favorite_topping_id' })
    }
  }

  beforeEach(async () => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'user': User,
      'favorite_ice_cream': FavoriteIceCream,
      'favorite_topping': FavoriteTopping,
      'topping_nutritional_fact': ToppingNutritionalFact,
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
      },
      topping_nutritional_facts: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        favorite_topping_id: {
          type: 'int',
          name: 'favorite_topping_id',
        },
        nutritional_fact: {
          type: 'string',
          name: 'nutritional_fact',
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
    await db.createTable('topping_nutritional_facts', t => {
      t.int('favorite_topping_id')
      t.string('nutritional_fact')
    })
    await db.insert('users', { email: 'fishman' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
    await db.insert('favorite_toppings', { flavor: 'rainbow sprinkles', favorite_ice_cream_id: 1 })
    await db.insert('topping_nutritional_facts', { nutritional_fact: 'not too good...', favorite_topping_id: 1 })
    await db.insert('topping_nutritional_facts', { nutritional_fact: 'dont do it', favorite_topping_id: 1 })
  })

  it ('joins two records', async () => {
    const user = await User.first()
    const toppings = await user.toppingNutritionalFacts()
    expect(toppings.length).toBe(2)
    expect(toppings.map(t => t.constructor.name).uniq()).toEqual(['ToppingNutritionalFact'])
    expect(toppings.map(t => t.favoriteToppingId).uniq()).toEqual([1])
    expect(toppings.map(t => t.nutritionalFact)).toEqual(['not too good...', 'dont do it'])
  })
})
