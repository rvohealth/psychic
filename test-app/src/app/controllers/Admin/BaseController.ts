import { PsychicOpenapiNames } from '../../../../../src/controller.js'
import ApplicationController from '../ApplicationController.js'

export default class AdminBaseController extends ApplicationController {
  public static get openapiNames(): PsychicOpenapiNames<AdminBaseController> {
    return ['admin']
  }
}
