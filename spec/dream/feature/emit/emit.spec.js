import { jest } from '@jest/globals'
import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import esp from 'src/esp'

describe('Dream#emits', () => {
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
        .emitsTo('user', { as: 'currentUser' })
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

    jest.spyOn(esp, 'transmit')
  })

  it ('emits to esp', async () => {
    const iceCream = await FavoriteIceCream.first()
    await iceCream.emit('user', '/ice-cream/updated', { fish: 10 })

    expect(esp.transmit).toHaveBeenCalledWith('ws:to:authToken', {
      to: 'currentUser',
      path: 'ice-cream/updated',
      id: iceCream.userId,
      data: {
        fish: 10,
      },
    })
  })
})

