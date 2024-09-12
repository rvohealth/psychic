import { GlobalNameNotSet } from '@rvohealth/dream'
import background, { BackgroundQueuePriority } from '.'
import { FunctionPropertyNames } from '../helpers/typeHelpers'

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

  public static async schedule<
    T,
    MethodName extends FunctionPropertyNames<Required<T>>,
    MethodFunc extends T[MethodName & keyof T],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MethodArgs extends MethodFunc extends (...args: any) => any ? Parameters<MethodFunc> : never,
  >(this: T, pattern: string, methodName: MethodName, ...args: MethodArgs) {
    const safeThis: typeof ScheduledService = this as typeof ScheduledService

    return await background.scheduledMethod(safeThis, pattern, methodName, {
      globalName: safeThis.globalName,
      args,
      priority: safeThis.priority,
    })
  }
}

export type PsychicScheduledServiceStaticMethods<T extends typeof ScheduledService> = Exclude<
  FunctionPropertyNames<Required<T>>,
  FunctionPropertyNames<typeof ScheduledService>
>
