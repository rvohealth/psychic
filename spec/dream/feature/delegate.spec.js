import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('delegating to associations', () => {
  class User extends Dream {
    static {
      User
        .hasOne('favorite_ice_cream', { foreignKey: 'user_id', inverseOf: 'user' })
        .delegate('delegatedMethod', { to: 'printdelegatedmethod', target: 'static' })
        .delegate('delegatedGetter', { to: 'printdelegatedgetter', target: 'static', getter: true })
    }

    static printdelegatedgetter() {
      return { delegatedGetter: 'delegated getter' }
    }

    static printdelegatedmethod() {
      return { delegatedMethod: () => 'delegated method' }
    }
  }

  class FavoriteIceCream extends Dream {
    static {
      FavoriteIceCream
        .belongsTo('user', { primaryKey: 'user_id', inverseOf: 'favorite_ice_cream' })
        .delegate('email', { to: 'user', getter: true })
        .delegate('name', { to: 'user' })
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
        name: {
          type: 'string',
          name: 'name',
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
      t.string('name')
    })
    await db.createTable('favorite_ice_creams', t => {
      t.int('user_id')
      t.string('flavor')
    })
    await db.insert('users', { email: 'fishman', name: 'Mr Fish' })
    await db.insert('favorite_ice_creams', { flavor: 'chocolate', user_id: 1 })
  })

  it ('delegates methods', async () => {
    const iceCream = await FavoriteIceCream.first()
    expect(await iceCream.name()).toEqual('Mr Fish')
  })

  it ('delegates getters', async () => {
    const iceCream = await FavoriteIceCream.first()
    expect(await iceCream.email).toEqual('fishman')
  })

  it ('delegates static methods', async () => {
    expect(await User.delegatedMethod()).toEqual('delegated method')
  })

  it ('delegates static getters', async () => {
    expect(await User.delegatedGetter).toEqual('delegated getter')
  })
})

