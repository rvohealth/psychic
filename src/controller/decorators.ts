import PsychicController from '.'
import { ControllerHook } from './hooks'

export function BeforeAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
    methodName?: string
  } = {}
): any {
  return function (target: any, methodName: string | symbol): any {
    if ((target as typeof PsychicController).isPsychicController) {
      if (!opts.methodName) throw 'Must pass methodName when calling beforeAction'
      if (!Object.getOwnPropertyDescriptor(target, 'controllerHooks')) target.controllerHooks = []
      target.controllerHooks.push(new ControllerHook(target.name, opts.methodName!, opts))
    } else if ((target as PsychicController).isPsychicControllerInstance) {
      if (!Object.getOwnPropertyDescriptor(target.constructor, 'controllerHooks'))
        target.constructor.controllerHooks = []
      target.constructor.controllerHooks.push(
        new ControllerHook(target.constructor.name, methodName.toString(), opts)
      )
    } else {
      throw 'Cannot call BeforeAction on a class that is not extending PsychicController'
    }
  }
}
