import { readFile } from 'fs/promises'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TelekineticAdapter from 'src/telekinesis/adapter'

export default class S3TelekineticAdapter extends TelekineticAdapter {
  initialize() {
    this._client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.auth.access_key_id,
        secretAccessKey: this.config.auth.secret_access_key,
      },
    })
  }

  // not sure if telekinesisKey should be part of file path yet...
  async putObject(record, path, telekinesisKey='default', opts={}) {
    const buffer = await readFile(path)

    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: this.config.bucket,
      Key: record.fileName,
      ...opts,
    })

    return await this._client.send(command)
  }

  async afterStore(record, path, telekinesisKey, opts) {
    await this.putObject(record, path, telekinesisKey, opts)
  }

  async retrieve(path) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
    })

    return await this._client.send(command)
  }

  sign(path) {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: path,
    })
    return getSignedUrl(this._client, command, { expiresIn: 3600 })
  }
}

