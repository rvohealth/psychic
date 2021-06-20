import path from 'path'
import { stat, copyFile } from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Dream from 'src/dream'
import config from 'src/config'

export default class PsychicStorageRecord extends Dream {
  get fileName() {
    return `${this.uuid}.${this.extension}`
  }

  initialize() {
    this
      .beforeCreate(async () => {
        if (!this.path) throw `Must pass a path to a file to create a storage record`
        if (! (await fileExists(this.path))) throw `Unable to locate file ${this.path}. Please pass a valid file path`
        const id = uuid()

        const info = path.parse(this.path)
        this.name = info.name
        this.extension = info.ext.replace(/^\./, '')

        const stats = await stat(this.path)
        this.size = stats.size

        this.uuid = id

        await copyFile(this.path, config.localStoragePath + '/' + id + info.ext)
      })
  }
}
