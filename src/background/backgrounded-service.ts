import { GlobalNameNotSet } from '@rvohealth/dream'
import background, { BackgroundQueuePriority } from '.'

export default function backgroundedService(priority: BackgroundQueuePriority = 'default') {
  return class BackgroundedService {
    public static get globalName(): string {
      if (!this._globalName) throw new GlobalNameNotSet(this)
      return this._globalName
    }

    public static setGlobalName(globalName: string) {
      this._globalName = globalName
    }
    public static _globalName: string | undefined

    public static async background(
      methodName: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...args: any[]
    ) {
      return await background.staticMethod(this, methodName, {
        globalName: this.globalName,
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
        globalName: (this.constructor as typeof BackgroundedService).globalName,
        args,
        constructorArgs,
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
        globalName: this.globalName,
        delaySeconds,
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
        globalName: (this.constructor as typeof BackgroundedService).globalName,
        delaySeconds,
        args,
        constructorArgs,
        priority,
      })
    }
  }
}
