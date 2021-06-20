import TelekineticAdapter from 'src/telekinesis/adapter'
import PsychicStorageRecord from 'src/psychic/dreams/psychic-storage-record'

export default class LocalTelekineticAdapter extends TelekineticAdapter {
  async store(path, telekinesisKey='default') {
    // validations!
    const storageRecord = await PsychicStorageRecord.create({
      path,
      telekinesisKey,
    })

    return storageRecord
  }
}
