import { GlobalNameNotSet } from '@rvohealth/dream'
import background, { BackgroundQueuePriority } from '.'

export default class ScheduledService {
  public static get priority(): BackgroundQueuePriority {
    return 'default' as const
  }

  public static get globalName(): string {
    if (!this._globalName) throw new GlobalNameNotSet(this)
    return this._globalName
  }

  public static setGlobalName(globalName: string) {
    this._globalName = globalName
  }
  public static _globalName: string | undefined

  public static async schedule(
    pattern: string,
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) {
    return await background.scheduledMethod(this, pattern, methodName, {
      globalName: this.globalName,
      args,
      priority: this.priority,
    })
  }
}
