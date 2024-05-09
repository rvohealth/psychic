import { WsControllerHook } from './hooks'
import PsychicWsController from './ws-controller'

export function BeforeIoAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {},
): (target: PsychicWsController, methodName: string | symbol) => void {
  return function (target: PsychicWsController, methodName: string | symbol): void {
    const psychicWsControllerClass: typeof PsychicWsController =
      target.constructor as typeof PsychicWsController
    if (!Object.getOwnPropertyDescriptor(psychicWsControllerClass, 'wsControllerHooks'))
      psychicWsControllerClass.wsControllerHooks = [...psychicWsControllerClass.wsControllerHooks]

    psychicWsControllerClass.wsControllerHooks.push(
      new WsControllerHook(psychicWsControllerClass.name, methodName.toString(), opts),
    )
  }
}
