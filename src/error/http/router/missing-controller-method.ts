import RouterError from './index'

export default class RouterMissingControllerMethod extends RouterError {
  constructor(controllerPath: string, method: string) {
    super(
      `\
The method on the controller you are attempting to load was not found:
  controller: ${controllerPath}
  method: ${method}
      `
    )
  }
}
