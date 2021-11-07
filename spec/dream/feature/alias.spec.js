import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'

describe('aliasing', () => {
  class User extends Dream {
    static printhamandcheese() {
      return 'hamandcheese'
    }

    static get printsteakneggs() {
      return 'steakandeggs'
    }

    static {
      User
        .alias('coolidge', { to: 'email' })
        .alias('coolidgeGetter', { to: 'printfishnchips', getter: true })
        .alias('coolidgeStatic', { to: 'printhamandcheese', target: 'static' })
        .alias('coolidgeStaticGetter', { to: 'printsteakneggs', target: 'static', getter: true })
    }

    get printfishnchips() {
      return 'fishandchips'
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
    })
    await db.insert('users', { email: 'fishman' })
  })

  it ('aliases instance methods', async () => {
    const user = await User.first()
    expect(user.coolidge()).toEqual('fishman')
  })

  it ('aliases instance getters', async () => {
    const user = await User.first()
    expect(user.coolidgeGetter).toEqual('fishandchips')
  })

  it ('aliases static methods', async () => {
    expect(User.coolidgeStatic()).toEqual('hamandcheese')
  })

  it ('aliases static getters', async () => {
    expect(User.coolidgeStaticGetter).toEqual('steakandeggs')
  })
})


