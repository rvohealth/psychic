import { OpenAPI, PsychicOpenapiControllerConfig } from '../../../../src'
import ApplicationController from './ApplicationController'

export default class OpenapiOverridesTestController extends ApplicationController {
  public static get openapiConfig(): PsychicOpenapiControllerConfig {
    return { omitDefaultHeaders: true, omitDefaultResponses: true, tags: ['hello', 'world'] }
  }

  @OpenAPI({
    status: 200,
  })
  public testOpenapiConfigOverrides() {
    this.ok()
  }
}
