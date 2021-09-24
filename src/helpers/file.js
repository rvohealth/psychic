import {
  readFile,
  writeFile,
} from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Psyfs from 'src/helpers/psyfs'

class File extends Psyfs {
  static async exists(arg1) {
    return (await fileExists(arg1))
  }

  static async read(arg1) {
    return (await readFile(arg1))
  }

  static async write(arg1, arg2) {
    await writeFile(arg1, arg2)
  }
}

export default File
