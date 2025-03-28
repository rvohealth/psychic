import { PsychicOpenapiNames } from '../../../../../src/controller/index.js'
import ApplicationController from '../ApplicationController.js'

export default class AdminAuthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<AdminAuthedController> {
    return ['admin']
  }
}
