import db from 'src/db'
import config from 'src/config'
import Dream from 'src/dream'
import ghosts from 'src/ghost/ghosts'

describe('Ghosts#addDreamStaticMethod', () => {
  class TestUser extends Dream {
    coolidge() {
      console.log('COOLIDGEEEEE')
    }
  }

  beforeEach(async () => {
    posess(config, 'dreams', 'get').returning({
      'test_user': TestUser,
    })

    posess(config, 'schema', 'get').returning({
      test_users: {
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

    await db.createTable('test_users', t => {
      t.string('email')
    })
    await db.insert('test_users', { email: 'fishman' })
  })

  it ('calls static method in bg', async () => {
    ghosts.addDreamStaticMethod('TestUser', 'coolidge', 'a', 'b', 'c')
  })
})
