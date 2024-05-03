import { Socket } from 'socket.io'
import PsychicConfig from '../config'
import { IoListenerHook } from './hooks'
import { Dream, IdType } from '@rvohealth/dream'
import Ws from './ws'

export default class PsychicIoListener {
  public static ioListenerHooks: IoListenerHook[] = []

  private config: PsychicConfig

  public get ioListenerPaths(): readonly string[] {
    throw new Error('Define ioListenerPaths in child class')
  }

  public async emit<I extends PsychicIoListener, P extends I['ioListenerPaths'][number]>(
    this: I,
    idOrDream: IdType | Dream,
    path: Record<P, P>[P],
    data: unknown
  ) {
    await new Ws(this.ioListenerPaths).emit(idOrDream, path as (typeof this.ioListenerPaths)[number], data)
  }

  constructor(
    protected socket: Socket,
    { config }: { config: PsychicConfig }
  ) {
    this.config = config
  }

  public async runAction(actionName: string) {
    await this.runBeforeActionsFor(actionName)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await (this as any)[actionName]()
  }

  private async runBeforeActionsFor(action: string) {
    const beforeActions = (this.constructor as typeof PsychicIoListener).ioListenerHooks.filter(hook =>
      hook.shouldFireForAction(action)
    )

    for (const hook of beforeActions) {
      if (hook.isStatic) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        await (this.constructor as any)[hook.methodName]()
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        await (this as any)[hook.methodName]()
      }
    }
  }
}
