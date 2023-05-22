import background from '.'

export default function backgroundedService(filepath: string) {
  const trimmedFilePath = filepath
    .replace(new RegExp(process.cwd()), '')
    .replace(/^\//, '')
    .replace(/\.ts$/, '')

  return class BackgroundedService {
    public static async background(methodName: string, ...args: any[]) {
      return await background.staticMethod(this, methodName, {
        filepath: trimmedFilePath,
        args,
      })
    }

    public async background(methodName: string, ...args: any[]) {
      return await background.instanceMethod(this.constructor, methodName, {
        filepath: trimmedFilePath,
        args,
      })
    }
  }
}
