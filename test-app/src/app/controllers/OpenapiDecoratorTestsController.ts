import { OpenAPI } from '../../../../src.js'
import { PsychicOpenapiNames } from '../../../../src/controller.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiDecoratorTestController extends ApplicationController {
  public static get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['mobile', 'admin']
  }

  @OpenAPI({
    status: 200,
  })
  public testMultipleOpenapiNames() {
    this.ok()
  }
}
