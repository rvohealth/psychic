import { jest } from '@jest/globals'
import Dream from 'src/dream'
import config from 'src/config'
import db from 'src/db'

describe('Dream#attribute (i.e. user.email)', () => {
  it ("returns the db value of that attribute", async () => {
    class ZebraFace extends Dream {}

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

    await db.createTable('zebra_faces', t => {
      t.int('num_stripes')
    })
    await db.insert('zebra_faces', [ { num_stripes: 30 } ])

    const zebraFace = await ZebraFace.first()
    expect(zebraFace.num_stripes).toBe(30)
    expect(zebraFace.numStripes).toBe(30)

    zebraFace.numStripes = 40
    expect(zebraFace.numStripes).toBe(40)
    expect(zebraFace.num_stripes).toBe(40)

    zebraFace.num_stripes = 50
    expect(zebraFace.numStripes).toBe(50)
    expect(zebraFace.num_stripes).toBe(50)
  })
})

