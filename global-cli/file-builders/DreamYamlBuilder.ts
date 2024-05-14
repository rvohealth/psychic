import fs from 'fs/promises'
import path from 'path'
import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class DreamYamlBuilder {
  public static async build(userOptions: NewAppCLIOptions) {
    const contents = (
      await fs.readFile(path.join(__dirname, '..', '..', 'boilerplate', 'api', '.dream.yml'))
    ).toString()
    return contents.replace('<PRIMARY_KEY_TYPE>', userOptions.primaryKeyType)
  }
}
