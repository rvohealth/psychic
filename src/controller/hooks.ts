export class ControllerHooks {
  public hooks: ControllerHook[] = []

  public add(
    controllerClassName: string,
    methodName: string,
    {
      isStatic = false,
      only = [],
      except = [],
    }: {
      isStatic?: boolean
      only?: string[]
      except?: string[]
    } = {}
  ) {
    this.hooks.push(
      new ControllerHook(controllerClassName, methodName, {
        isStatic,
        only,
        except,
      })
    )
  }

  public for(controllerClassName: string, actionName: string, isStatic: boolean = false) {
    return this.hooks.filter(
      hook =>
        hook.controllerClassName === controllerClassName &&
        hook.isStatic === isStatic &&
        hook.shouldFireForAction(actionName)
    )
  }
}

export class ControllerHook {
  public controllerClassName: string
  public methodName: string
  public isStatic: boolean
  public only: string[]
  public except: string[]
  constructor(
    controllerClassName: string,
    methodName: string,
    {
      isStatic = false,
      only = [],
      except = [],
    }: {
      isStatic?: boolean
      only?: string[]
      except?: string[]
    }
  ) {
    this.controllerClassName = controllerClassName
    this.methodName = methodName
    this.isStatic = isStatic
    this.only = only
    this.except = except
  }

  public shouldFireForAction(actionName: string) {
    if (!!this.only.length && this.only.includes(actionName)) return true
    if (!!this.only.length && !this.only.includes(actionName)) return false
    if (!!this.except.length && this.except.includes(actionName)) return false
    if (!!this.except.length && !this.except.includes(actionName)) return true
    return true
  }
}

const controllerHooks = new ControllerHooks()
export default controllerHooks
