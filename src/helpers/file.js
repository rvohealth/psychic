import {
  readFile,
  writeFile,
} from 'fs/promises'
import fse from 'fs-extra'
import fileExists from 'src/helpers/file-exists'
import exec from 'src/helpers/exec'

class File {
  static async copy(arg1, arg2) {
    await fse.copy(arg1, arg2)
  }

  static async exists(arg1) {
    return (await fileExists(arg1))
  }

  static async read(arg1) {
    await readFile(arg1)
  }

  static async replace(arg1, arg2) {
    if ((await File.exists(arg2))) await exec('rm -rf ' + arg2)
    await File.copy(arg1, arg2)
  }

  static async rm(arg1) {
    await fse.remove(arg1)
  }

  static async write(arg1, arg2) {
    await writeFile(arg1, arg2)
  }
}

export default File
