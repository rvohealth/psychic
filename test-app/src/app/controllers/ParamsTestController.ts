import { OpenAPI } from '../../../../src/index.js'
import ApplicationController from './ApplicationController.js'

export default class ParamsTestController extends ApplicationController {
  public testCastParam() {
    this.castParam('testString', 'string')
    this.noContent()
  }

  public displayParams() {
    this.ok(this.castParam('howyadoin', 'string[]'))
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

  @OpenAPI({
    security: [],
    query: {
      'myArray[]': {
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        required: false,
      },
    },
  })
  public testOpenapiValidationOnExplicitQueryArrays() {
    this.castParam('myArray[]', 'string[]', { enum: ['a', 'b', 'c'] })
    this.castParam('myArray', 'string[]', { enum: ['a', 'b', 'c'] })
    this.noContent()
  }

  @OpenAPI({
    security: [],
    query: {
      myArray: {
        schema: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        required: false,
      },
    },
  })
  public testOpenapiValidationOnExplicitQueryArraysWithoutBrackets() {
    this.castParam('myArray', 'string[]', { enum: ['a', 'b', 'c'] })
    this.castParam('myArray[]', 'string[]', { enum: ['a', 'b', 'c'] })
    this.noContent()
  }
}
