import passport from 'passport'
import PsychicRouter from '../../../src/router/index.js'
import AdminTestController from '../app/controllers/Admin/TestController.js'
import ApiUsersController from '../app/controllers/Api/UsersController.js'
import ApiV1UsersController from '../app/controllers/Api/V1/UsersController.js'
import AuthedUsersController from '../app/controllers/AuthedUsersController.js'
import BalloonsController from '../app/controllers/BalloonsController.js'
import CircularController from '../app/controllers/CircularController.js'
import GreeterController from '../app/controllers/GreeterController.js'
import OpenapiDecoratorTestController from '../app/controllers/OpenapiDecoratorTestsController.js'
import OpenapiMissingRouteTestController from '../app/controllers/OpenapiMissingRouteTestController.js'
import OpenapiOverridesTestController from '../app/controllers/OpenapiOverridesTestsController.js'
import OpenapiValidationTestsController from '../app/controllers/OpenapiValidationTestsController.js'
import ParamsTestController from '../app/controllers/ParamsTestController.js'
import PassportAuthedController from '../app/controllers/PassportAuthedController.js'
import PetsController from '../app/controllers/PetsController.js'
import ResponseStatusesController from '../app/controllers/ResponseStatusesController.js'
import ScopeTestController from '../app/controllers/ScopeTestController.js'
import SerializerFallbackTestsController from '../app/controllers/SerializerFallbackTestsController.js'
import SerializerTestsController from '../app/controllers/SerializerTestsController.js'
import UnauthedUsersController from '../app/controllers/UnauthedUsersController.js'
import UsersController from '../app/controllers/UsersController.js'
import User from '../app/models/User.js'

export default function routes(r: PsychicRouter) {
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
  r.get('display-params', ParamsTestController, 'displayParams')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  r.get('non-existent-action', ParamsTestController, 'thisActionDoesntExistIntentionally' as any)
  r.post('openapi-validation-test', ParamsTestController, 'testOpenapiValidation')
  r.get(
    'openapi-validation-on-explicit-query-arrays',
    ParamsTestController,
    'testOpenapiValidationOnExplicitQueryArrays',
  )
  r.get(
    'openapi-validation-on-explicit-query-arrays-without-brackets',
    ParamsTestController,
    'testOpenapiValidationOnExplicitQueryArraysWithoutBrackets',
  )
  r.get('users/howyadoin', UsersController, 'howyadoin')
  r.post('users/post-howyadoin', UsersController, 'postHowyadoin')
  r.get('openapi/multiple-openapi-names', OpenapiDecoratorTestController, 'testMultipleOpenapiNames')
  r.get('openapi/request-body-for-type', OpenapiDecoratorTestController, 'testRequestBodyForType')
  r.get('openapi/multiple-serializer-statements', OpenapiDecoratorTestController, 'testMultipleSerializers')
  r.get('openapi/openapi-overrides', OpenapiOverridesTestController, 'testOpenapiConfigOverrides')

  r.resources('users', r => {
    r.collection(r => {
      r.get('paginated', UsersController, 'paginated')
      r.post('paginated-post', UsersController, 'paginatedPost')
      r.get('cursor-paginated', UsersController, 'cursorPaginated')
      r.post('cursor-paginated-post', UsersController, 'cursorPaginatedPost')
      r.get('scroll-paginated', UsersController, 'scrollPaginated')
      r.post('scroll-paginated-post', UsersController, 'scrollPaginatedPost')
    })
    r.resources('pets', { only: [] })
    r.get('ping', UsersController, 'ping')
    r.get('with-posts', UsersController, 'showWithPosts')
  })
  r.resources('pets', { only: ['create', 'update'] }, r => {
    r.put('update2', PetsController, 'update2')
    r.post('my-posts', PetsController, 'myPosts')
    r.collection(r => {
      r.get('hello', PetsController, 'hello')
    })
  })

  r.get('serializer-tests/naked-dream', SerializerTestsController, 'nakedDream')
  r.get('serializer-tests/sanitized', SerializerTestsController, 'sanitized')

  r.get('queryOpenapiTest', OpenapiValidationTestsController, 'queryOpenapiTest')
  r.get('queryRequiredOpenapiTest', OpenapiValidationTestsController, 'queryRequiredOpenapiTest')
  r.get('queryRequiredValueTest', OpenapiValidationTestsController, 'queryRequiredValueTest')
  r.get('responseBodyOpenapiTest', OpenapiValidationTestsController, 'responseBodyOpenapiTest')
  r.get('responseBodyObjectOpenapiTest', OpenapiValidationTestsController, 'responseBodyObjectOpenapiTest')
  r.get(
    'responseBodyNestedObjectOpenapiTest',
    OpenapiValidationTestsController,
    'responseBodyNestedObjectOpenapiTest',
  )
  r.get(
    'responseBodyboilerplateSchemaTest',
    OpenapiValidationTestsController,
    'responseBodyboilerplateSchemaTest',
  )
  r.get('responseAlternateStatusTest', OpenapiValidationTestsController, 'responseAlternateStatusTest')
  r.get('headersOpenapiTest', OpenapiValidationTestsController, 'headersOpenapiTest')
  r.post('requestBodyOpenapiTest', OpenapiValidationTestsController, 'requestBodyOpenapiTest')
  r.post(
    'requestBodyNestedObjectOpenapiTest',
    OpenapiValidationTestsController,
    'requestBodyNestedObjectOpenapiTest',
  )
  r.post(
    'requestBodyboilerplateSchemaTest',
    OpenapiValidationTestsController,
    'requestBodyboilerplateSchemaTest',
  )

  r.post('beforeAction403', OpenapiValidationTestsController, 'beforeAction403')
  r.post('beforeActionParamsAccessed', OpenapiValidationTestsController, 'beforeActionParamsAccessed')

  r.post('invalidRequestBody', OpenapiValidationTestsController, 'invalidRequestBody')

  r.post(
    'dontThrowMissingSerializersDefinition204',
    OpenapiValidationTestsController,
    'dontThrowMissingSerializersDefinition204',
  )
  r.post(
    'dontThrowMissingSerializersDefinition201',
    OpenapiValidationTestsController,
    'dontThrowMissingSerializersDefinition201',
  )

  r.get(
    'serializer-fallbacks/uses-openapi-serializer',
    SerializerFallbackTestsController,
    'usesOpenapiSerializer',
  )
  r.get(
    'serializer-fallbacks/doesnt-use-openapi-serializer',
    SerializerFallbackTestsController,
    'doesntUseOpenapiSerializer',
  )
  r.get(
    'serializer-fallbacks/overrides-openapi-serializer',
    SerializerFallbackTestsController,
    'overridesOpenapiSerializer',
  )
  r.get(
    'serializer-fallbacks/uses-openapi-serializer-with-serializer-key',
    SerializerFallbackTestsController,
    'usesOpenapiSerializerWithSerializerKey',
  )

  // hooks tests
  r.get('users-before-all-test', UsersController, 'beforeAllTest')
  r.get('users-before-action-sequence', UsersController, 'beforeActionSequence')
  r.post('failed-to-save-test', UsersController, 'failedToSaveTest')
  r.post('fail-saving-incompatible-data-test', UsersController, 'failSavingIncompatibleDataTest')
  r.post('fail-saving-too-long-data', UsersController, 'failSavingTooLongData')
  r.post('force-throw', UsersController, 'forceThrow')

  // response status tests
  // 2xx series
  r.get('ok', ResponseStatusesController, 'sendOk') // 200
  r.get('ok-null', ResponseStatusesController, 'sendOkNull') // 200
  r.get('ok-undefined', ResponseStatusesController, 'sendOkUndefined') // 200
  r.get('created', ResponseStatusesController, 'sendCreated') // 201
  r.get('accepted', ResponseStatusesController, 'sendAccepted') // 202
  r.get('non-authoritative-information', ResponseStatusesController, 'sendNonAuthoritativeInformation') // 203
  r.get('no-content', ResponseStatusesController, 'sendNoContent') // 204
  r.get('reset-content', ResponseStatusesController, 'sendResetContent') // 205

  // 3xx series
  r.get('moved-permanently', ResponseStatusesController, 'sendMovedPermanently') // 301
  r.get('found', ResponseStatusesController, 'sendFound') // 302
  r.get('see-other', ResponseStatusesController, 'sendSeeOther') // 303
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

  r.resources('balloons', { only: ['index', 'show'] }, r => {
    r.collection(r => {
      r.get('paginated', BalloonsController, 'paginated')
      r.get('cursor-paginated', BalloonsController, 'cursorPaginated')
      r.get('scroll-paginated', BalloonsController, 'scrollPaginated')
      r.get('index-different-dreams', BalloonsController, 'indexDifferentDreams')
      r.get('index-dreams-and-view-model', BalloonsController, 'indexDreamsAndViewModel')
    })
  })

  r.get('/admin/test', AdminTestController, 'test')

  // ensure that random middleware can still be provided top-level,
  // same as with an express application
  r.get('middleware-test', (_, res) => {
    res.json('get middleware test')
  })
  r.post('middleware-test', (_, res) => {
    res.json('post middleware test')
  })
  r.patch('middleware-test', (_, res) => {
    res.json('patch middleware test')
  })
  r.put('middleware-test', (_, res) => {
    res.json('put middleware test')
  })
  r.delete('middleware-test', (_, res) => {
    res.json('delete middleware test')
  })
  r.options('middleware-test', (_, res) => {
    res.json('options middleware test')
  })

  r.namespace('nested-middleware', r => {
    // ensure that nested middleware can apply nested route
    // paths correctly
    r.get('middleware-test', (_, res) => {
      res.json('nested middleware test')
    })
  })

  r.post('passport-test', [
    passport.authenticate('local'),
    (req, res) => {
      res.json({ id: (req.user as User)?.id })
    },
  ])
  r.get('passport-test-persistence', (req, res) => {
    res.json({ id: (req.user as User)?.id })
  })
  r.get('controller-passport-test-persistence', PassportAuthedController, 'testPassportAuth')

  if (process.env.SKIP_TEST_ROUTE !== '1') {
    r.get('openapi-missing-route-test', OpenapiMissingRouteTestController, 'missingRoute')
  }
}
