import { readFile } from 'fs/promises'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import TelekineticAdapter from 'src/telekinesis/adapter'
import config from 'src/config'

export default class S3TelekineticAdapter extends TelekineticAdapter {
  initialize(telekinesisKey) {
    this._telekinesisKey = telekinesisKey
    const telekinesisConfig = this.config

    this._client = new S3Client({
      region: telekinesisConfig.region,
      credentials: {
        accessKeyId: telekinesisConfig.auth.access_key_id,
        secretAccessKey: telekinesisConfig.auth.secret_access_key,
      },
    })
  }

  get config() {
    return config.telekinesisConfigFor(this._telekinesisKey)
  }

  // not sure if telekinesisKey should be part of file path yet...
  async putObject(record, path, telekinesisKey='default', opts={}) {
    const buffer = await readFile(path)
    const telekinesisConfig = this.config

    const command = new PutObjectCommand({
      Body: buffer,
      Bucket: telekinesisConfig.bucket,
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
    console.log(command)

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

