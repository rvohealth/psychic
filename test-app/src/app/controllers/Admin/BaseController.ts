import { PsychicOpenapiNames } from '../../../../../src/controller'
import ApplicationController from '../ApplicationController'

export default class AdminBaseController extends ApplicationController {
  public static get openapiNames(): PsychicOpenapiNames<AdminBaseController> {
    return ['admin']
  }
}
