import CrystalBall from 'src/crystal-ball'
import Dream from 'src/dream'
import Channel from 'src/channel'
import config from 'src/config'
import axios from 'axios'

async function startServer() {
  return new Promise((accept) => {
    const crystalBall = new CrystalBall()
    crystalBall
      .boot()
      .then(() => {
        crystalBall._server = crystalBall.app.listen(666, async () => {
          accept()
        })
      })
  })
}

describe('Namespace#get', () => {
  class TestUser extends Dream {
  }

  class TestUsersChannel extends Channel {
    fish() {
      this.json({ fish: 10 })
    }
  }

  beforeEach(() => {
    jest.spyOn(config, 'dreams', 'get').mockReturnValue({
      'test_user': TestUser,
    })

    jest.spyOn(config, 'channels', 'get').mockReturnValue({
      'TestUsers': { default: TestUsersChannel },
    })

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
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
        password: {
          type: 'string',
          name: 'password',
        },
      }
    })
  })

  it ('sets up create, put, patch, show, index, delete routes', async () => {
    posess(config, 'routeCB', 'get').returning(r => {
      r.get('fish', 'test-users#fish')
    })

    expect(CrystalBall.routes.length).toBe(1)
    await startServer()
    const resp = await axios.get('http://localhost:666/fish')
    expect(resp.data).toEqual({ fish: 10 })
  })
})


