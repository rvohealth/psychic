import Dream from 'src/dream'
import config from 'src/singletons/config'

describe('Dream.schema', () => {
  it ('returns the schema from config', async () => {
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

    expect(ZebraFace.schema).toBe(config.schema.zebra_faces)
  })
})
