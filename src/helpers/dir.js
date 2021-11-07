import {
  mkdir,
  readdir,
  lstat,
  opendir,
} from 'fs/promises'
import fileExists from 'src/helpers/file-exists'
import Psyfs from 'src/helpers/psyfs'
import l from 'src/singletons/l'

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

  static async mkdir(path, { recursive }={}) {
    if (recursive) return await this.mkdirRecursive(path)
    await mkdir(path)
  }

  static async mkdirRecursive(path) {
    const pathSegments = path.split('/')
    const paths = []

    for (const segment of pathSegments) {
      paths.push(segment)
      await this.mkdirUnlessExists(paths.join('/'))
    }
  }

  static async mkdirUnlessExists(arg1, { recursive }={}) {
    const exists = await fileExists(arg1)
    if (!exists)
      await this.mkdir(arg1, { recursive })
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
            files.push(item)
        }
      }
      return files

    } else
      return items
  }

  // TODO: add alias
  static async read(path, opts) {
    return await Dir.readdir(path, opts)
  }
}

export default Dir
