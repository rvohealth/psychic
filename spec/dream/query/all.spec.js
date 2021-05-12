import { jest } from '@jest/globals'
import Dream from 'src/dream'
import db from 'src/db'
import config from 'src/config'

describe('Dream.all', () => {
  it ('fetches all records from db', async () => {
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

    class ZebraFace extends Dream {}
    await db.createTable('zebra_faces', t => {
      t.int('num_stripes')
    })
    await db.insert('zebra_faces', [
      { num_stripes: 30 },
      { num_stripes: 40 },
      { num_stripes: 50 },
    ])

    const result = await ZebraFace.all()
    expect(result.length).toBe(3)
    expect(
      result
        .map(r => r.constructor.name)
        .uniq()
    ).toEqual(['ZebraFace'])
  })
})
