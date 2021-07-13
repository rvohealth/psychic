import path from 'path'
import PsychicStorageRecord from 'src/psychic/dreams/psychic-storage-record'

export default class TelekineticAdapter {
  // define in child class
  initialize() {}

  constructor(key) {
    this.initialize(key)
  }

  fileInfo(filePath) {
    return path.parse(filePath)
  }

  async createRecord(path, telekinesisKey) {
    return await PsychicStorageRecord.create({
      path,
      telekinesisKey,
    })
  }

  // define in child class
  async afterStore() {}

  async store(path, telekinesisKey, opts) {
    // validations!
    const storageRecord = await PsychicStorageRecord.create({
      path,
      telekinesisKey,
    })

    await this.afterStore(storageRecord, path, telekinesisKey, opts)

    return storageRecord
  }
}
