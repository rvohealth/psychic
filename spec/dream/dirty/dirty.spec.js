import { jest } from '@jest/globals'
import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'

describe('Dream#dirty', () => {
  it ("detects when attributes have been updated", async () => {
    class ZebraFace extends Dream {}
    await db.createTable('zebra_faces', t => {
      t.int('num_stripes')
    })
    await db.insert('zebra_faces', [ { num_stripes: 30 } ])

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
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
    })

    const zebraFace = await ZebraFace.first()

    expect(zebraFace.dirty).toBe(false)
    zebraFace.numStripes = 40
    expect(zebraFace.dirty).toBe(true)
  })
})

