import fs from 'fs'
import {
  open,
  readFile,
  writeFile,
} from 'fs/promises'
import Psyfs from 'src/helpers/psyfs'

class File extends Psyfs {
  static async append(filename, text) {
    const file = await File.open(filename, 'a')
    await file.appendFile(text)
  }

  static async contains(filename, text) {
    const contents = await File.read(filename)
    return new RegExp(text).test(contents.toString())
  }

  static async isDuplicate(filePath1, filePath2) {
    const file1 = await File.read(filePath1)
    const file2 = await File.read(filePath2)
    return file1.toString() === file2.toString()
  }

  static async open(filename, flags) {
    return (await open(filename, flags))
  }

  static async read(arg1, { text }={}) {
    const results = await readFile(arg1)
    if (text) return results.toString()
    return results
  }

  static async text(path) {
    return await this.read(path, { text: true })
  }

  static async touch(path, contents='') {
    if (await File.exists(path)) return
    await File.write(path, contents)
  }

  static async write(path, content, options) {
    try {
      await writeFile(path, content, options)
    } catch(error) {
      console.error(error)
    }
  }

  static async overwrite(path, content) {
    await this.unlinkIfExists(path)
    await this.write(path, content)
  }

  static stream(path, opts) {
    return fs.createWriteStream(path, opts)
  }
}

export default File
