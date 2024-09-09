import fs from 'fs/promises'
import path from 'path'
import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class AppConfigBuilder {
  public static async build(opts: { appName: string; userOptions: NewAppCLIOptions }) {
    const contents = (
      await fs.readFile(path.join(__dirname, '..', '..', '..', 'boilerplate', 'api', 'src', 'conf', 'app.ts'))
    ).toString()

    return contents
      .replace(
        '<BACKGROUND_CONNECT>',
        opts.userOptions.redis ? 'await background.connect()' : '// await background.connect()',
      )
      .replace('<APP_NAME>', opts.appName)
      .replace('<API_ONLY>', opts.userOptions.apiOnly.toString())
      .replace('<USE_REDIS>', opts.userOptions.redis.toString())
      .replace('<USE_WS>', opts.userOptions.ws.toString())
  }
}
