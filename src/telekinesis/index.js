import LocalTelekineticAdapter from 'src/telekinesis/adapter/local'
import S3TelekineticAdapter from 'src/telekinesis/adapter/s3'

export default class Telekinesis {
  constructor({ key, adapter }) {
    this._key = key
    this._adapterType = adapter

    switch(adapter) {
    case 'local':
      this._adapter = new LocalTelekineticAdapter(key)
      break

    case 's3':
      this._adapter = new S3TelekineticAdapter(key)
      break

    default:
      throw `Unrecognized telekinetic adapter type ${adapter}`
    }
  }

  async retrieve(arg1) {
    return await this._adapter.retrieve(this._parseRetrieveArgs(arg1))
  }

  async store(filePath, arg1, arg2) {
    return await this._adapter.store(filePath, this._parseStoreArgs(arg1, arg2))
  }

  _parseRetrieveArgs(arg1) {
    if (!arg1) throw `argument must be a string or a PsychicStorageRecord`
    if (typeof arg1 === 'string') return arg1
    if (arg1?.constructor?.name === 'PsychicStorageRecord') return arg1.fileName
    throw `unrecognized argument ${arg1}. Pass either a string or a PsychicStorageRecord`
  }

  _parseStoreArgs(arg1, arg2) {
    if (arg2) return { telekinesisKey: arg1, opts: arg2 }
    if (typeof arg1 === 'object') return { telekinesisKey: null, opts: arg2 }
    return { telekinesisKey: arg1, opts: null }
  }
}
