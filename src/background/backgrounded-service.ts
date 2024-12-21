import { GlobalNameNotSet } from '@rvohealth/dream'
import { Job } from 'bullmq'
import { FunctionPropertyNames } from '../helpers/typeHelpers'
import background, { BackgroundJobConfig } from './'

export default class BackgroundedService {
  public static get backgroundJobConfig(): BackgroundJobConfig {
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

  public static async background<
    T,
    MethodName extends PsychicBackgroundedServiceStaticMethods<T & typeof BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    MethodArgs extends BackgroundableMethodArgs<MethodFunc>,
  >(this: T, methodName: MethodName, ...args: MethodArgs) {
    const safeThis: typeof BackgroundedService = this as typeof BackgroundedService

    return await background.staticMethod(safeThis, methodName, {
      globalName: safeThis.globalName,
      args,
      jobConfig: safeThis.backgroundJobConfig,
    })
  }

  public static async backgroundWithDelay<
    T,
    MethodName extends PsychicBackgroundedServiceStaticMethods<T & typeof BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    MethodArgs extends BackgroundableMethodArgs<MethodFunc>,
  >(this: T, delaySeconds: number, methodName: MethodName, ...args: MethodArgs) {
    const safeThis: typeof BackgroundedService = this as typeof BackgroundedService

    return await background.staticMethod(safeThis, methodName, {
      globalName: safeThis.globalName,
      delaySeconds,
      args,
      jobConfig: safeThis.backgroundJobConfig,
    })
  }

  public async background<
    T,
    MethodName extends PsychicBackgroundedServiceInstanceMethods<T & BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    MethodArgs extends BackgroundableMethodArgs<MethodFunc>,
  >(
    this: T,
    methodName: MethodName,
    {
      args,
      constructorArgs,
    }: {
      args?: MethodArgs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructorArgs?: any[]
    } = {},
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const constructor = (this as any).constructor as typeof BackgroundedService

    return await background.instanceMethod(constructor, methodName, {
      globalName: constructor.globalName,
      args,
      constructorArgs,
      jobConfig: constructor.backgroundJobConfig,
    })
  }

  public async backgroundWithDelay<
    T,
    MethodName extends PsychicBackgroundedServiceInstanceMethods<T & BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    MethodArgs extends BackgroundableMethodArgs<MethodFunc>,
  >(
    this: T,
    delaySeconds: number,
    methodName: MethodName,
    {
      args,
      constructorArgs,
    }: {
      args?: MethodArgs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructorArgs?: any[]
    } = {},
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const constructor = (this as any).constructor as typeof BackgroundedService

    return await background.instanceMethod(constructor, methodName, {
      globalName: constructor.globalName,
      delaySeconds,
      args,
      constructorArgs,
      jobConfig: constructor.backgroundJobConfig,
    })
  }
}

export type PsychicBackgroundedServiceStaticMethods<T extends typeof BackgroundedService> = Exclude<
  FunctionPropertyNames<Required<T>>,
  FunctionPropertyNames<typeof BackgroundedService>
>

export type PsychicBackgroundedServiceInstanceMethods<T extends BackgroundedService> = Exclude<
  FunctionPropertyNames<Required<T>>,
  FunctionPropertyNames<BackgroundedService>
>

type OmitJobFromEndOfArguments<Original extends unknown[]> = Original extends [Job]
  ? // this [string] check after [Job] check is in case the backgrounded method accepts
    // an argument typed as `any`
    Original extends [string]
    ? Original
    : []
  : Original extends [...infer Rest, Job]
    ? // this string check after Job check is in case the backgrounded method accepts
      // an argument typed as `any`
      Original extends [...unknown[], string]
      ? Original
      : Rest
    : Original

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BackgroundableMethodArgs<MethodFunc> = MethodFunc extends (...args: any) => any
  ? OmitJobFromEndOfArguments<Parameters<MethodFunc>>
  : never
