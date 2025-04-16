import { OpenAPI } from '../../../../src/index.js'
import ApplicationController from './ApplicationController.js'

export default class ParamsTestController extends ApplicationController {
  public testCastParam() {
    this.castParam('testString', 'string')
    this.noContent()
  }

  @OpenAPI({
    security: [],
    requestBody: {
      type: 'object',
      properties: {
        howyadoin: {
          type: ['string', 'null'],
        },
      },
    },
  })
  public testOpenapiValidation() {
    this.noContent()
  }
}
