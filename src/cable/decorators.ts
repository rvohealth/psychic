import { IoListenerHook } from './hooks'
import PsychicIoListener from './io-listener'

export function BeforeIoAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {}
): (target: PsychicIoListener, methodName: string | symbol) => void {
  return function (target: PsychicIoListener, methodName: string | symbol): void {
    const psychicIoListenerClass: typeof PsychicIoListener = target.constructor as typeof PsychicIoListener
    if (!Object.getOwnPropertyDescriptor(psychicIoListenerClass, 'ioListenerHooks'))
      psychicIoListenerClass.ioListenerHooks = [...psychicIoListenerClass.ioListenerHooks]

    psychicIoListenerClass.ioListenerHooks.push(
      new IoListenerHook(psychicIoListenerClass.name, methodName.toString(), opts)
    )
  }
}
