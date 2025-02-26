import { OpenAPI } from '../../../../src'
import { PsychicOpenapiNames } from '../../../../src/controller'
import ApplicationController from './ApplicationController'

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
