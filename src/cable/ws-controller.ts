import { Socket } from 'socket.io'
import PsychicConfig from '../config'
import { WsControllerHook } from './hooks'

export default class PsychicWsController {
  public static wsControllerHooks: WsControllerHook[] = []

  private config: PsychicConfig

  public get wsControllerPaths(): readonly string[] {
    throw new Error('Define wsControllerPaths in child class')
  }

  constructor(
    protected socket: Socket,
    { config }: { config: PsychicConfig },
  ) {
    this.config = config
  }

  public async runAction(actionName: string) {
    await this.runBeforeActionsFor(actionName)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await (this as any)[actionName]()
  }

  private async runBeforeActionsFor(action: string) {
    const beforeActions = (this.constructor as typeof PsychicWsController).wsControllerHooks.filter(hook =>
      hook.shouldFireForAction(action),
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
