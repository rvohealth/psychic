import path from 'path'
import { stat } from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Dream from 'src/dream'

export default class PsychicStorageRecord extends Dream {
  static {
    PsychicStorageRecord
      .beforeCreate(async function() {
        if (!this.path) throw `Must pass a path to a file to create a storage record`
        if (! (await fileExists(this.path))) throw `Unable to locate file ${this.path}. Please pass a valid file path`
        const id = uuid()

        const info = path.parse(this.path)
        this.name = info.name
        this.extension = info.ext.replace(/^\./, '')

        const stats = await stat(this.path)
        this.size = stats.size

        this.uuid = id
      })
  }

  get fileName() {
    return `${this.uuid}.${this.extension}`
  }
}
