import { GlobalNameNotSet } from '@rvohealth/dream'
import { FunctionPropertyNames } from '../helpers/typeHelpers'
import background, { BackgroundQueuePriority } from './'

export default class BackgroundedService {
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

  public static async background<
    T extends typeof BackgroundedService,
    MethodName extends PsychicBackgroundedServiceStaticMethods<T>,
    MethodFunc extends T[MethodName & keyof T],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MethodArgs extends MethodFunc extends (...args: any) => any ? Parameters<MethodFunc> : never,
  >(this: T, methodName: MethodName, ...args: MethodArgs) {
    const safeThis: typeof BackgroundedService = this as typeof BackgroundedService

    return await background.staticMethod(safeThis, methodName, {
      globalName: safeThis.globalName,
      args,
      priority: safeThis.priority,
    })
  }

  public static async backgroundWithDelay<
    T extends typeof BackgroundedService,
    MethodName extends PsychicBackgroundedServiceStaticMethods<T>,
    MethodFunc extends T[MethodName & keyof T],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MethodArgs extends MethodFunc extends (...args: any) => any ? Parameters<MethodFunc> : never,
  >(this: T, delaySeconds: number, methodName: MethodName, ...args: MethodArgs) {
    const safeThis: typeof BackgroundedService = this as typeof BackgroundedService

    return await background.staticMethod(safeThis, methodName, {
      globalName: safeThis.globalName,
      delaySeconds,
      args,
      priority: safeThis.priority,
    })
  }

  public async background<
    T,
    MethodName extends PsychicBackgroundedServiceInstanceMethods<T & BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MethodArgs extends MethodFunc extends (...args: any) => any ? Parameters<MethodFunc> : never,
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
      priority: constructor.priority,
    })
  }

  public async backgroundWithDelay<
    T,
    MethodName extends PsychicBackgroundedServiceInstanceMethods<T & BackgroundedService>,
    MethodFunc extends T[MethodName & keyof T],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MethodArgs extends MethodFunc extends (...args: any) => any ? Parameters<MethodFunc> : never,
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
      priority: constructor.priority,
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
