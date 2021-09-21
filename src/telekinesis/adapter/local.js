import { copyFile } from 'fs/promises'
import config from 'src/singletons/config'
import TelekineticAdapter from 'src/telekinesis/adapter'

export default class LocalTelekineticAdapter extends TelekineticAdapter {
  async afterStore(record, path) {
    await copyFile(path, `${config.localStoragePath}/${record.fileName}`)
  }
}
