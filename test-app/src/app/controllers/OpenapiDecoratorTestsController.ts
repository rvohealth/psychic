import { PsychicOpenapiNames } from '../../../../src/controller/index.js'
import { OpenAPI } from '../../../../src/index.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiDecoratorTestController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<ApplicationController> {
    return ['mobile', 'admin']
  }

  @OpenAPI({
    status: 200,
  })
  public testMultipleOpenapiNames() {
    this.ok()
  }
}
