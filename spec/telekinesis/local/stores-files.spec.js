import { jest } from '@jest/globals'
import Telekinesis from 'src/telekinesis'
import config from 'src/config'
import db from 'src/db'
import fileExists from 'src/helpers/file-exists'

const telekinesis = new Telekinesis({
  key: 'default',
  adapter: 'local',
})

describe ('Telekinesis#store (local)', () => {
  beforeEach(async () => {
  })

  it ('stores file locally, creating new psychic storage record', async () => {
    await db.createTable('psychic_storage_records', t => {
      t.uuid('uuid')
      t.string('name')
      t.string('path')
      t.string('extension')
      t.string('telekinesis_key')
      t.string('telekinesis_id')
      t.string('adapter')
      t.int('size')
      t.timestamp('created_at')
    })

    // jest.spyOn(config, 'db', 'get').mockReturnValue({
    //   test: {
    //   }
    // })

    jest.spyOn(config, 'schema', 'get').mockReturnValue({
      psychic_storage_records: {
        id: {
          type: 'int',
          name: 'id',
          primary: true,
          unique: true
        },
        uuid: {
          type: 'uuid',
          name: 'uuid',
        },
        name: {
          type: 'string',
          name: 'name',
        },
        path: {
          type: 'string',
          name: 'path',
        },
        telekinesis_key: {
          type: 'string',
          name: 'telekinesis_key',
        },
        telekinesis_id: {
          type: 'string',
          name: 'telekinesis_id',
        },
        size: {
          type: 'int',
          name: 'size',
        },
        created_at: {
          type: 'timestamp',
          name: 'created_at',
        },
      },
    })

    const result = await telekinesis.store('spec/support/storage/test.jpg')
    expect(result.extension).toEqual('jpg')
    expect(await fileExists(`tmp/storage/spec/${result.fileName}`)).toBe(true)
  })
})
