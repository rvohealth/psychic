import { PsychicOpenapiNames } from '../../../../../src/controller/index.js'
import ApplicationController from '../ApplicationController.js'

export default class InternalAuthedController extends ApplicationController {
  public static override get openapiNames(): PsychicOpenapiNames<InternalAuthedController> {
    return ['internal']
  }
}
