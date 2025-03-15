import RouterError from './index.js.js'

export default class RouterMissingControllerMethod extends RouterError {
  protected get messageString(): string {
    return `\
The method on the controller you are attempting to load was not found:
  controller: ${this.controllerPath}
  method: ${this.method}
      `
  }

  constructor(
    protected controllerPath: string,
    protected method: string,
  ) {
    super()
  }
}
