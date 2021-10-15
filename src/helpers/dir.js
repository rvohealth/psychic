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

  static async isEmpty(path, { ignoreHidden }={}) {
    try {
      const directory = await opendir(path)
      const entry = await directory.read()
      await directory.close()

      if (ignoreHidden && /^\./.test(entry?.name || ''))
        return false

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

  static async readdir(path, { onlyDirs, onlyFiles, ignoreHidden }={}) {
    const items = await readdir(path)

    if (onlyDirs) {
      const dirs = []
      for (const item of items) {
        if (await Dir.isDir(path + '/' + item))
          if (
            !ignoreHidden ||
            (ignoreHidden && !/^\./.test(item))
          )
            dirs.push(item)
      }
      return dirs

    } else if (onlyFiles) {
      const files = []
      for (const item of items) {
        if (!await Dir.isDir(path + '/' + item)) {
          if (
            !ignoreHidden ||
            (ignoreHidden && !/^\./.test(item))
          )
            files.push(path + '/' + item)
        }
      }
      return files

    } else
      return items
  }
}

export default Dir
