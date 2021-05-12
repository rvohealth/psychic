import Dream from 'src/dream'
import db from 'src/db'
import config from 'src/config'

describe('Dream.save', () => {
  class ZebraFace extends Dream {}
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

    jest.spyOn(config, 'schema', 'get').mockReturnValue(mockSchema)
    // const staticSpy = jest.fn().mockReturnValue(mockSchema.zebra_faces)
    // Object.defineProperty(ZebraFace, 'schema', {
    //   get: staticSpy,
    // })
    // ZebraFace.schema = staticSpy
    // jest.spyOn(ZebraFace, 'schema', 'get').mockReturnValue(mockSchema.zebra_faces)
  })

  it ('persists changes to the database', async () => {
    const zebraFace = new ZebraFace()
    zebraFace.numStripes = 40

    expect(await db.count('zebra_faces').do()).toBe(0)
    await zebraFace.save()
    expect(await db.count('zebra_faces').do()).toBe(1)
    const updatedZebraFace = await ZebraFace.first()
    expect(updatedZebraFace.numStripes).toBe(40)
  })

  describe ('when the instance is already persisted', () => {
    it ('updates the instance in the db', async () => {
      await db.insert('zebra_faces', { num_stripes: 40 })
      const zebraFace = await ZebraFace.first()

      zebraFace.numStripes = 30
      expect(await db.count('zebra_faces').do()).toBe(1)
      await zebraFace.save()
      expect(await db.count('zebra_faces').do()).toBe(1)

      const updatedZebraFace = await ZebraFace.first()
      expect(updatedZebraFace.numStripes).toBe(30)
    })
  })
})
