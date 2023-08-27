import path from 'path'
import background from '.'

export default function backgroundedService(filepath: string) {
  return class BackgroundedService {
    public static async background(methodName: string, ...args: any[]) {
      return await background.staticMethod(this, methodName, {
        filepath,
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
        filepath,
      })
    }
  }
}
