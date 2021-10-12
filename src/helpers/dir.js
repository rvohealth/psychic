import {
  mkdir,
  readdir,
  lstat,
  opendir,
} from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Psyfs from 'src/helpers/psyfs'

class Dir extends Psyfs {
  static async isDir(path) {
    try {
      const stat = await lstat(path)
      return stat.isDirectory()
    } catch (e) {
      return false
    }
  }

  static async isEmpty(path) {
    try {
      const directory = await opendir(path)
      const entry = await directory.read()
      await directory.close()

      return entry === null
    } catch (error) {
      return false
    }
  }

  static async mkdir(arg1) {
    await mkdir(arg1)
  }

  static async mkdirUnlessExists(arg1) {
    const exists = await fileExists(arg1)
    if (!exists)
      await mkdir(arg1)
  }

  static async readdir(...args) {
    return await readdir(...args)
  }
}

export default Dir
