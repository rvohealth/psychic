import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'
import ghosts from 'src/ghost/ghosts'

class User extends Dream {
  static fishman() {
    console.log('HAMBURGERS')
  }
}

beforeEach(async () => {
  await db.createTable('users', t => {
    t.string('email')
  })

  const mockSchema = {
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
    }
  }

  posess(config, 'schema', 'get').returning(mockSchema)
})

describe ('ghost', () => {
  it ('returns a Ghost', () => {
    const _ghost = ghost(User, 'fishman', { fish: 10 })
    const spy = posess(ghosts, 'addStaticMethod').returning(true)
    _ghost.spawn()
    expect(spy).toHaveBeenCalledWith(User, 'fishman', { fish: 10 })
  })
})

