import {
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { jest } from '@jest/globals'
import Telekinesis from 'src/telekinesis'
import config from 'src/singletons/config'
import db from 'src/singletons/db'

describe ('Telekinesis#retrieve (S3)', () => {
  it ('retrieves the object from s3 using valid signed url', async () => {
    const telekinesis = new Telekinesis({
      key: 'remote',
      adapter: 's3',
      config: config.telekinesisConfig.remote,
    })

    await db.createTable('psychic_storage_records', t => {
      t.uuid('uuid')
      t.string('name')
      t.string('path')
      t.string('extension')
      t.string('telekinesis_id')
      t.string('telekinesis_key')
      t.string('current_path')
      t.string('current_adapter')
      t.string('current_bucket')
      t.string('adapter')
      t.int('size')
      t.timestamp('created_at')
    })

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
        telekinesis_id: {
          type: 'string',
          name: 'telekinesis_id',
        },
        telekinesis_key: {
          type: 'string',
          name: 'telekinesis_key',
        },
        current_path: {
          type: 'string',
          name: 'current_path',
        },
        current_adapter: {
          type: 'string',
          name: 'current_adapter',
        },
        current_bucket: {
          type: 'string',
          name: 'current_bucket',
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

    jest.spyOn(telekinesis._adapter._client, 'send').mockReturnValue('fishman')

    const result = await telekinesis.retrieve('remote/test.jpg')
    expect(result).toBe('fishman')

    // TODO: add helper to combine these two calls, maybe
    // `toHaveBeenCalledWith(classContaining({ ... }))`
    expect(telekinesis._adapter._client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand))
    expect(telekinesis._adapter._client.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Bucket: ENV.PSYCHIC_CORE_AWS_BUCKET,
          Key: 'remote/test.jpg',
        })
      })
    )
  })
})

