import fs from 'fs'
import {
  open,
  readFile,
  writeFile,
} from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Psyfs from 'src/helpers/psyfs'

class File extends Psyfs {
  static async append(filename, text) {
    const file = await File.open(filename, 'a')
    await file.appendFile(text)
  }

  static async exists(arg1) {
    return (await fileExists(arg1))
  }

  static async open(filename, flags) {
    return (await open(filename, flags))
  }

  static async read(arg1) {
    return (await readFile(arg1))
  }

  static async write(arg1, arg2, options) {
    await writeFile(arg1, arg2, options)
  }

  static stream(path, opts) {
    return fs.createWriteStream(path, opts)
  }
}

export default File
