import { GlobalNameNotSet } from '@rvohealth/dream'
import background, { BackgroundJobConfig } from '.'
import { FunctionPropertyNames } from '../helpers/typeHelpers'

export default class BaseScheduledService {
  public static get backgroundJobConfig(): BackgroundJobConfig<BaseScheduledService> {
    return {}
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
    const safeThis: typeof BaseScheduledService = this as typeof BaseScheduledService

    return await background.scheduledMethod(safeThis, pattern, methodName, {
      globalName: safeThis.globalName,
      args,
      jobConfig: safeThis.backgroundJobConfig,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get psychicTypes(): any {
    throw new Error('Must define psychicTypes getter in BackgroundedService class within your application')
  }
}

export type PsychicScheduledServiceStaticMethods<T extends typeof BaseScheduledService> = Exclude<
  FunctionPropertyNames<Required<T>>,
  FunctionPropertyNames<typeof BaseScheduledService>
>
