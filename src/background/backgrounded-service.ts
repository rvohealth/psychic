import background, { BackgroundQueuePriority } from '.'

export default function backgroundedService(filepath: string, priority: BackgroundQueuePriority = 'default') {
  return class BackgroundedService {
    public static async background(
      methodName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      return await background.staticMethod(this, methodName, {
        filepath,
        args,
        priority,
      })
    }

    public async background(
      methodName: string,
      {
        args,
        constructorArgs,
      }: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args?: any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructorArgs?: any[]
      } = {},
    ) {
      return await background.instanceMethod(this.constructor, methodName, {
        args,
        constructorArgs,
        filepath,
        priority,
      })
    }

    public static async backgroundWithDelay(
      delaySeconds: number,
      methodName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      return await background.staticMethod(this, methodName, {
        delaySeconds,
        filepath,
        args,
        priority,
      })
    }

    public async backgroundWithDelay(
      delaySeconds: number,
      methodName: string,
      {
        args,
        constructorArgs,
      }: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args?: any[]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        constructorArgs?: any[]
      } = {},
    ) {
      return await background.instanceMethod(this.constructor, methodName, {
        delaySeconds,
        args,
        constructorArgs,
        filepath,
        priority,
      })
    }
  }
}
