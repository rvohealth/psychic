import path from 'path'
import background from '.'

export default function backgroundedService(filepath: string) {
  const trimmedFilePath = filepath
    .replace(new RegExp(process.cwd()), '')
    .replace(/^\//, '')
    .replace(/\.[jt]s$/, '')

  return class BackgroundedService {
    public static async background(methodName: string, ...args: any[]) {
      return await background.staticMethod(this, methodName, {
        filepath: trimmedFilePath,
        args,
      })
    }

    public async background(
      methodName: string,
      {
        args,
        constructorArgs,
      }: {
        args?: any[]
        constructorArgs?: any[]
      } = {}
    ) {
      return await background.instanceMethod(this.constructor, methodName, {
        args,
        constructorArgs,
        filepath: trimmedFilePath,
      })
    }
  }
}
