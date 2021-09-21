import { jest } from '@jest/globals'
import Dream from 'src/dream'
import db from 'src/singletons/db'
import config from 'src/singletons/config'

describe('Dream.first', () => {
  beforeEach(() => {
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
  })

  it ('fetches first record from db', async () => {
    class ZebraFace extends Dream {}
    await db.createTable('zebra_faces', t => {
      t.int('num_stripes')
    })
    await db.insert('zebra_faces', [
      { num_stripes: 30 },
      { num_stripes: 40 },
      { num_stripes: 50 },
    ])

    const zebraface = await ZebraFace.first()
    expect(zebraface.constructor.name).toBe('ZebraFace')
    expect(zebraface.attribute('num_stripes')).toBe(30)
  })

  describe ('when no records exist', () => {
    it ('returns null', async () => {
      class ZebraFace extends Dream {}
      await db.createTable('zebra_faces', t => {
        t.int('num_stripes')
      })

      expect(await ZebraFace.first()).toBeNull()
    })
  })
})
