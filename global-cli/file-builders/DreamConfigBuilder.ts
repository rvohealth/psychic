import fs from 'fs/promises'
import path from 'path'
import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class DreamConfigBuilder {
  public static async build(opts: { appName: string; userOptions: NewAppCLIOptions }) {
    const contents = (
      await fs.readFile(path.join(__dirname, '..', '..', 'boilerplate', 'api', 'src', 'conf', 'dream.ts'))
    ).toString()

    return contents.replace('<PRIMARY_KEY_TYPE>', `'${opts.userOptions.primaryKeyType || 'bigserial'}'`)
  }
}
