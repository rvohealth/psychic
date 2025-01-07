import User from '../models/User'
import ApplicationController from './ApplicationController'

export default class ResponseStatusesController extends ApplicationController {
  // 200
  public sendOk() {
    this.ok('custom content')
  }

  // 201
  public sendCreated() {
    this.created('custom content')
  }

  // 202
  public sendAccepted() {
    this.accepted('custom content')
  }

  // 203
  public sendNonAuthoritativeInformation() {
    this.nonAuthoritativeInformation()
  }

  // 204
  public sendNoContent() {
    this.noContent()
  }

  // 205
  public sendResetContent() {
    this.resetContent('custom content')
  }

  // 206
  public sendPartialContent() {
    this.partialContent('custom content')
  }

  // 207
  public sendMultiStatus() {
    this.multiStatus('custom content')
  }

  // 208
  public sendAlreadyReported() {
    this.alreadyReported('custom content')
  }

  // 226
  public sendIMUsed() {
    this.imUsed('custom content')
  }

  // 301
  public sendMovedPermanently() {
    this.movedPermanently('/chalupas')
  }

  // 302
  public sendFound() {
    this.found('/chalupas')
  }

  // 303
  public sendSeeOther() {
    this.seeOther('/chalupas')
  }

  // 304
  public sendNotModified() {
    this.notModified('/chalupas')
  }

  // 307
  public sendTemporaryRedirect() {
    this.temporaryRedirect('/chalupas')
  }

  // 308
  public sendPermanentRedirect() {
    this.permanentRedirect('/chalupas')
  }

  // 400
  public throwBadRequest() {
    this.badRequest()
  }

  // 401
  public throwUnauthorized() {
    this.unauthorized('custom message')
  }

  // 402
  public throwPaymentRequired() {
    this.paymentRequired('custom message')
  }

  // 403
  public throwForbidden() {
    this.forbidden('custom message')
  }

  // 404
  public throwNotFound() {
    this.notFound('custom message')
  }

  // also 404
  public async throwRecordNotFound() {
    await User.findOrFail('999999999')
    this.ok()
  }

  // 405
  public throwMethodNotAllowed() {
    this.methodNotAllowed('custom message')
  }

  // 406
  public throwNotAcceptable() {
    this.notAcceptable('custom message')
  }

  // 407
  public throwProxyAuthenticationRequired() {
    this.proxyAuthenticationRequired('custom message')
  }

  // 408
  public throwRequestTimeout() {
    this.requestTimeout('custom message')
  }

  // 409
  public throwConflict() {
    this.conflict('custom message')
  }

  // 410
  public throwGone() {
    this.gone('custom message')
  }

  // 411
  public throwLengthRequired() {
    this.lengthRequired('custom message')
  }

  // 412
  public throwPreconditionFailed() {
    this.preconditionFailed('custom message')
  }

  // 413
  public throwPayloadTooLarge() {
    this.payloadTooLarge('custom message')
  }

  // 414
  public throwUriTooLong() {
    this.uriTooLong('custom message')
  }

  // 415
  public throwUnsupportedMediaType() {
    this.unsupportedMediaType('custom message')
  }

  // 416
  public throwRangeNotSatisfiable() {
    this.rangeNotSatisfiable('custom message')
  }

  // 417
  public throwExpectationFailed() {
    this.expectationFailed('custom message')
  }

  // 418
  public throwImATeampot() {
    this.imATeampot('custom message')
  }

  // 421
  public throwMisdirectedRequest() {
    this.misdirectedRequest('custom message')
  }

  // 422
  public throwUnprocessableEntity() {
    this.unprocessableEntity({ errors: { hello: ['world'] } })
  }

  // 423
  public throwLocked() {
    this.locked('custom message')
  }

  // 424
  public throwFailedDependency() {
    this.failedDependency('custom message')
  }

  // 425
  public throwTooEarly() {
    this.tooEarly('custom message')
  }

  // 426
  public throwUpgradeRequired() {
    this.upgradeRequired('custom message')
  }

  // 428
  public throwPreconditionRequired() {
    this.preconditionRequired('custom message')
  }

  // 429
  public throwTooManyRequests() {
    this.tooManyRequests('custom message')
  }

  // 431
  public throwRequestHeaderFieldsTooLarge() {
    this.requestHeaderFieldsTooLarge('custom message')
  }

  // 451
  public throwUnavailableForLegalReasons() {
    this.unavailableForLegalReasons('custom message')
  }

  // 500
  public throwInternalServerError() {
    this.internalServerError()
  }

  // 501
  public throwNotImplemented() {
    this.notImplemented('custom message')
  }

  // 502
  public throwBadGateway() {
    this.badGateway('custom message')
  }

  // 503
  public throwServiceUnavailable() {
    this.serviceUnavailable('custom message')
  }

  // 504
  public throwGatewayTimeout() {
    this.gatewayTimeout('custom message')
  }

  // 505
  public throwHttpVersionNotSupported() {
    this.httpVersionNotSupported('custom message')
  }

  // 506
  public throwVariantAlsoNegotiates() {
    this.variantAlsoNegotiates('custom message')
  }

  // 507
  public throwInsufficientStorage() {
    this.insufficientStorage('custom message')
  }

  // 508
  public throwLoopDetected() {
    this.loopDetected('custom message')
  }

  // 510
  public throwNotExtended() {
    this.notExtended('custom message')
  }

  // 511
  public throwNetworkAuthenticationRequired() {
    this.networkAuthenticationRequired('custom message')
  }
}
