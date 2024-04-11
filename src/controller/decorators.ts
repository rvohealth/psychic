import PsychicController from '.'
import { ControllerHook } from './hooks'

export function BeforeAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {},
): (target: PsychicController, methodName: string | symbol) => void {
  return function (target: PsychicController, methodName: string | symbol): void {
    const psychicControllerClass: typeof PsychicController = target.constructor as typeof PsychicController
    if (!Object.getOwnPropertyDescriptor(psychicControllerClass, 'controllerHooks'))
      psychicControllerClass.controllerHooks = [...psychicControllerClass.controllerHooks]

    psychicControllerClass.controllerHooks.push(
      new ControllerHook(psychicControllerClass.name, methodName.toString(), opts),
    )
  }
}
