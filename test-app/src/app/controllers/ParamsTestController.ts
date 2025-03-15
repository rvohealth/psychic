import { OpenAPI } from '../../../../src.js'
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
          type: 'string',
          nullable: true,
        },
      },
    },
  })
  public testOpenapiValidation() {
    this.noContent()
  }
}
