import RouterError from './index.js'

export default class RouterMissingController extends RouterError {
  protected override get messageString(): string {
    return `\
The controller you are attempting to load was not found:
  ${this.controllerPath}
      `
  }

  constructor(protected controllerPath: string) {
    super()
  }
}
