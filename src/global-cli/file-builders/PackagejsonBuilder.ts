import { NewAppCLIOptions } from '../helpers/gatherUserInput'

export default class PackagejsonBuilder {
  public static async buildAPI(userOptions: NewAppCLIOptions) {
    const packagejson = (await import('../../../boilerplate/api/package.json')).default

    if (userOptions.apiOnly) return JSON.stringify(packagejson, null, 2)

    switch (userOptions.client) {
      case 'react':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        ;(packagejson.scripts as any)['client'] = `PORT=3000 yarn --cwd=../client dev`
    }

    return JSON.stringify(packagejson, null, 2)
  }
}
