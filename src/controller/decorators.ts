import controllerHooks from './hooks'

export function BeforeAction(
  opts: {
    isStatic?: boolean
    only?: string[]
    except?: string[]
  } = {}
) {
  return function (target: any, propertyKey: string) {
    controllerHooks.add(target.constructor.name, propertyKey, opts)
  }
}
