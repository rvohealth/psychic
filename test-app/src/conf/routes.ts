import PsychicRouter from '../../../src/router.js'
import AdminTestController from '../app/controllers/Admin/TestController.js'
import ApiUsersController from '../app/controllers/Api/UsersController.js'
import ApiV1UsersController from '../app/controllers/Api/V1/UsersController.js'
import AuthedUsersController from '../app/controllers/AuthedUsersController.js'
import CircularController from '../app/controllers/CircularController.js'
import GreeterController from '../app/controllers/GreeterController.js'
import OpenapiDecoratorTestController from '../app/controllers/OpenapiDecoratorTestsController.js'
import OpenapiOverridesTestController from '../app/controllers/OpenapiOverridesTestsController.js'
import ParamsTestController from '../app/controllers/ParamsTestController.js'
import PetsController from '../app/controllers/PetsController.js'
import ResponseStatusesController from '../app/controllers/ResponseStatusesController.js'
import ScopeTestController from '../app/controllers/ScopeTestController.js'
import UnauthedUsersController from '../app/controllers/UnauthedUsersController.js'
import UsersController from '../app/controllers/UsersController.js'

export default (r: PsychicRouter) => {
  r.get('circular', CircularController, 'hello')
  r.get('ping', UsersController, 'ping')
  r.post('ping', UsersController, 'ping')
  r.put('ping', UsersController, 'ping')
  r.patch('ping', UsersController, 'ping')
  r.delete('ping', UsersController, 'ping')
  r.options('ping', UsersController, 'ping')
  r.post('auth', UnauthedUsersController, 'signin')
  r.get('auth-ping', AuthedUsersController, 'ping')
  r.get('api-ping', ApiUsersController, 'ping')
  r.post('cast-param-test', ParamsTestController, 'testCastParam')
  r.post('openapi-validation-test', ParamsTestController, 'testOpenapiValidation')
  r.get('users/howyadoin', UsersController, 'howyadoin')
  r.get('openapi/multiple-openapi-names', OpenapiDecoratorTestController, 'testMultipleOpenapiNames')
  r.get('openapi/openapi-overrides', OpenapiOverridesTestController, 'testOpenapiConfigOverrides')

  r.resources('users', r => {
    r.resources('pets', { only: [] })
    r.get('ping', UsersController, 'ping')
  })
  r.resources('pets', { only: ['create', 'update'] }, r => {
    r.put('update2', PetsController, 'update2')
    r.post('my-posts', PetsController, 'myPosts')
  })

  // hooks tests
  r.get('users-before-all-test', UsersController, 'beforeAllTest')
  r.get('users-before-action-sequence', UsersController, 'beforeActionSequence')
  r.post('failed-to-save-test', UsersController, 'failedToSaveTest')
  r.post('force-throw', UsersController, 'forceThrow')

  // response status tests
  // 2xx series
  r.get('ok', ResponseStatusesController, 'sendOk') // 200
  r.get('created', ResponseStatusesController, 'sendCreated') // 201
  r.get('accepted', ResponseStatusesController, 'sendAccepted') // 202
  r.get('non-authoritative-information', ResponseStatusesController, 'sendNonAuthoritativeInformation') // 203
  r.get('no-content', ResponseStatusesController, 'sendNoContent') // 204
  r.get('reset-content', ResponseStatusesController, 'sendResetContent') // 205

  // 3xx series
  r.get('moved-permanently', ResponseStatusesController, 'sendMovedPermanently') // 301
  r.get('found', ResponseStatusesController, 'sendFound') // 302
  r.get('see-other', ResponseStatusesController, 'sendSeeOther') // 303
  r.get('not-modified', ResponseStatusesController, 'sendNotModified') // 304
  r.get('temporary-redirect', ResponseStatusesController, 'sendTemporaryRedirect') // 307
  r.get('permanent-redirect', ResponseStatusesController, 'sendPermanentRedirect') // 308

  // 4xx series
  r.get('bad-request', ResponseStatusesController, 'throwBadRequest') // 400
  r.get('unauthorized', ResponseStatusesController, 'throwUnauthorized') // 401
  r.get('payment-required', ResponseStatusesController, 'throwPaymentRequired') // 402
  r.get('forbidden', ResponseStatusesController, 'throwForbidden') // 403
  r.get('not-found', ResponseStatusesController, 'throwNotFound') // 404
  r.get('record-not-found', ResponseStatusesController, 'throwRecordNotFound') // 404
  r.get('method-not-allowed', ResponseStatusesController, 'throwMethodNotAllowed') // 405
  r.get('not-acceptable', ResponseStatusesController, 'throwNotAcceptable') // 406
  r.get('proxy-authentication-required', ResponseStatusesController, 'throwProxyAuthenticationRequired') // 407
  r.get('conflict', ResponseStatusesController, 'throwConflict') // 409
  r.get('gone', ResponseStatusesController, 'throwGone') // 410
  r.get('precondition-failed', ResponseStatusesController, 'throwPreconditionFailed') // 412
  r.get('content-too-large', ResponseStatusesController, 'throwContentTooLarge') // 413
  r.get('unsupported-media-type', ResponseStatusesController, 'throwUnsupportedMediaType') // 415
  r.get('expectation-failed', ResponseStatusesController, 'throwExpectationFailed') // 417
  r.get('im-a-teapot', ResponseStatusesController, 'throwImATeampot') // 418
  r.get('misdirected-request', ResponseStatusesController, 'throwMisdirectedRequest') // 421
  r.get('unprocessable-content', ResponseStatusesController, 'throwUnprocessableContent') // 422
  r.get('locked', ResponseStatusesController, 'throwLocked') // 423
  r.get('failed-dependency', ResponseStatusesController, 'throwFailedDependency') // 424
  r.get('precondition-required', ResponseStatusesController, 'throwPreconditionRequired') // 428
  r.get('too-many-requests', ResponseStatusesController, 'throwTooManyRequests') // 429
  r.get('request-header-fields-too-large', ResponseStatusesController, 'throwRequestHeaderFieldsTooLarge') // 431
  r.get('unavailable-for-legal-reasons', ResponseStatusesController, 'throwUnavailableForLegalReasons') // 451

  // 5xx series
  r.get('internal-server-error', ResponseStatusesController, 'throwInternalServerError') // 500
  r.get('not-implemented', ResponseStatusesController, 'throwNotImplemented') // 501
  r.get('bad-gateway', ResponseStatusesController, 'throwBadGateway') // 502
  r.get('service-unavailable', ResponseStatusesController, 'throwServiceUnavailable') // 503
  r.get('gateway-timeout', ResponseStatusesController, 'throwGatewayTimeout') // 504
  r.get('insufficient-storage', ResponseStatusesController, 'throwInsufficientStorage') // 507
  r.get('not-extended', ResponseStatusesController, 'throwNotExtended') // 510
  // end: response status tests

  r.namespace('api', r => {
    r.get('ping', ApiUsersController, 'ping')
    r.namespace('v1', r => {
      r.get('ping', ApiV1UsersController, 'ping')
      r.resources('users', { only: ['index'] })
    })
    r.resources('users', { only: ['create', 'update'] })
    r.resources('pets', { only: ['create', 'update'] })
  })

  r.scope('scoped-things', r => {
    r.get('testing-scopes', ScopeTestController, 'scopeTest')
  })

  r.post('login', UsersController, 'login')
  // TODO this one uses new syntax
  r.resources('users', { controller: UsersController, only: ['create', 'index'] }, r => {
    r.get('hello', UsersController, 'hello')
    r.post('', UsersController, 'doathing')
    r.get('justforspecs', UsersController, 'justforspecs')
  })

  r.resource('greeter', { only: ['show'] }, r => {
    r.get('hello', GreeterController, 'hello')
    r.get('justforspecs', GreeterController, 'justforspecs')
  })

  r.get('/admin/test', AdminTestController, 'test')
}
