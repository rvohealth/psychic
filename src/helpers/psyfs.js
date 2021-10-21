import {
  unlink,
} from 'fs/promises'
import fse from 'fs-extra'
import fileExists from 'src/helpers/file-exists'
import exec from 'src/helpers/exec'

class Psyfs {
  static async copy(arg1, arg2) {
    await fse.copy(arg1, arg2)
  }

  static async exists(arg1) {
    return (await fileExists(arg1))
  }

  static async replace(arg1, arg2) {
    if ((fileExists(arg2))) await exec('rm -rf ' + arg2)
    await Psyfs.copy(arg1, arg2)
  }

  static async rm(arg1) {
    await fse.remove(arg1)
  }

  static async rmIfExists(arg1) {
    const exists = await Psyfs.exists(arg1)
    if (exists)
      await Psyfs.rm(arg1)
  }

  static async unlink(arg1) {
    await unlink(arg1)
  }

  static async unlinkIfExists(arg1) {
    const exists = await Psyfs.exists(arg1)
    if (exists)
      await Psyfs.unlink(arg1)
  }
}

export default Psyfs
