import { create } from 'spec/factories'
import Channel from 'src/channel'
import Projection from 'src/projection'
import Dream from 'src/dream'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

class ZebraFace extends Dream {}

describe('Channel#project', () => {
  beforeEach(async () => {
    await db.createTable('zebra_faces', t => {
      t.int('num_stripes')
    })

    const mockSchema = {
      zebra_faces: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        num_stripes: {
          type: 'int',
          name: 'num_stripes',
        },
      }
    }

    posess(config, 'schema', 'get').returning(mockSchema)
  })

  it ('casts the passed object to json', async () => {
    class TestUserChannel extends Channel {}

    const vision = create('crystalBall.vision', 'test-users', 'index', {})
    const channel = new TestUserChannel(vision)
    const spy = posess(Projection.prototype, 'cast').returning('fish')
    const dream = new ZebraFace()

    channel.project(dream)
    expect(spy).toHaveBeenCalled()
  })
})


