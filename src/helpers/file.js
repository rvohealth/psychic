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

  static async contains(filename, text) {
    const contents = await File.read(filename)
    return new RegExp(text).test(contents.toString())
  }

  static async exists(arg1) {
    return await fileExists(arg1)
  }

  static async isDuplicate(filePath1, filePath2) {
    const file1 = await File.read(filePath1)
    const file2 = await File.read(filePath2)
    return file1.toString() === file2.toString()
  }

  static async open(filename, flags) {
    return (await open(filename, flags))
  }

  static async read(arg1) {
    return (await readFile(arg1))
  }

  static async touch(path, contents='') {
    if (await File.exists(path)) return
    await File.write(path, contents)
  }

  static async write(arg1, arg2, options) {
    await writeFile(arg1, arg2, options)
  }

  static stream(path, opts) {
    return fs.createWriteStream(path, opts)
  }
}

export default File
