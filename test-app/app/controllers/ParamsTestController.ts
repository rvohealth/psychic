import { OpenAPI } from '../../../src'
import ApplicationController from './ApplicationController'

export default class ParamsTestController extends ApplicationController {
  public testCastParam() {
    this.castParam('testString', 'string')
    this.noContent()
  }

  @OpenAPI({
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
