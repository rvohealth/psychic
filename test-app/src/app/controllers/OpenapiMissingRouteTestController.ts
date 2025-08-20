import { OpenAPI } from '../../../../src/index.js'
import ApplicationController from './ApplicationController.js'

export default class OpenapiMissingRouteTestController extends ApplicationController {
  @OpenAPI({
    status: 204,
    requestBody: {
      type: 'object',
      properties: {
        numericParam: 'number',
      },
    },
  })
  public missingRoute() {
    this.noContent()
  }
}
