import { PsychicOpenapiNames } from '../../../../../src/controller'
import ApplicationController from '../ApplicationController'

export default class AdminBaseController extends ApplicationController {
  public static get openapiName(): PsychicOpenapiNames<AdminBaseController> {
    return 'admin'
  }
}
