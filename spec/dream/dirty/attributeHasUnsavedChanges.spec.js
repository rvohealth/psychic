import { jest } from '@jest/globals'
import Dream from 'src/dream'
import config from 'src/singletons/config'
import db from 'src/db'

describe('Dream#attributeHasUnsavedChanges (i.e. user.emailHasUnsavedChanges)', () => {
  it ("detects when attributes have been updated", async () => {
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

    expect(zebraFace.numStripesHasUnsavedChanges).toBe(false)
    zebraFace.numStripes = 40
    expect(zebraFace.numStripesHasUnsavedChanges).toBe(true)
  })
})

