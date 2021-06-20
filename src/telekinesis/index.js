import LocalTelekineticAdapter from 'src/telekinesis/adapter/local'

export default class Telekinesis {
  constructor({ key, adapter }) {
    this._key = key
    this._adapterType = adapter

    switch(adapter) {
    case 'local':
      this._adapter = new LocalTelekineticAdapter()
      break

    default:
      throw `Unrecognized telekinetic adapter type ${adapter}`
    }
  }

  async store(filePath, telekinesisKey) {
    return await this._adapter.store(filePath, telekinesisKey)
  }
}
