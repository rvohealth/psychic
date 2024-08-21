import { GlobalNameNotSet } from '@rvohealth/dream'
import background, { BackgroundQueuePriority } from '..'

export default class BaseBackgroundedService {
  public static get globalName(): string {
    if (!this._globalName) throw new GlobalNameNotSet(this)
    return this._globalName
  }

  public static setGlobalName(globalName: string) {
    this._globalName = globalName
  }
  public static _globalName: string | undefined

  public static get priority(): BackgroundQueuePriority {
    throw new Error(
      'Do not use BaseBackgroundedService directly. Instead, Use an inheriting class, like BackgroundedService, UrgentBackgroundedService, etc...',
    )
  }

  public static async background(
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) {
    return await background.staticMethod(this, methodName, {
      globalName: this.globalName,
      args,
      priority: this.priority,
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
      globalName: (this.constructor as typeof BaseBackgroundedService).globalName,
      args,
      constructorArgs,
      priority: (this.constructor as typeof BaseBackgroundedService).priority,
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
      priority: this.priority,
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
      globalName: (this.constructor as typeof BaseBackgroundedService).globalName,
      delaySeconds,
      args,
      constructorArgs,
      priority: (this.constructor as typeof BaseBackgroundedService).priority,
    })
  }
}
