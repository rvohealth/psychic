import { OpenAPI } from '../../../../src/index.js'
import User from '../models/User.js'
import ApplicationController from './ApplicationController.js'

export default class ServerErrorTestsController extends ApplicationController {
  public testServerErrorHandlerWithUnexpectedError() {
    // this will throw a 403, which should cause the
    // underlying error handlers to pick it up,
    throw new Error('testing handlers for unknown errors')
  }

  public testServerErrorHandlerWithBadRequest() {
    // 400 should be picked up by custom error handler
    this.badRequest()
  }

  @OpenAPI({
    query: {
      // tests will intentionally leave this field blank
      // to trigger an openapi validation failure
      howyadoin: {
        required: true,
      },
    },
  })
  public testServerErrorHandlerWithOpenapiFailure() {
    this.noContent()
  }

  public testServerErrorHandlerWithForbidden() {
    // 403 should not be picked up by custom error handler
    this.forbidden()
  }

  public testServerErrorHandlerWithUnauthorized() {
    // 401 should not be picked up by custom error handler
    this.unauthorized()
  }

  public testServerErrorHandlerWithNotFound() {
    // 404 should not be picked up by custom error handler
    this.notFound()
  }

  public async testServerErrorHandlerWithRecordNotFound() {
    // not finding records within dream should raise a 404,
    // and not be picked up by custom error handler
    await User.findOrFail('1234566789')
  }
}
