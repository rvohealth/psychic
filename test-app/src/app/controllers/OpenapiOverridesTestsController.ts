import { OpenAPI, PsychicOpenapiControllerConfig } from '../../../../src/package-exports/index.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiOverridesTestController extends ApplicationController {
  public static override get openapiConfig(): PsychicOpenapiControllerConfig {
    return { omitDefaultHeaders: true, omitDefaultResponses: true, tags: ['hello', 'world'] }
  }

  @OpenAPI({
    status: 200,
  })
  public testOpenapiConfigOverrides() {
    this.ok()
  }
}
