import RouterError from './index'

export default class RouterMissingController extends RouterError {
  constructor(controllerPath: string) {
    super(
      `\
The controller you are attempting to load was not found:
  ${controllerPath}
      `,
    )
  }
}
