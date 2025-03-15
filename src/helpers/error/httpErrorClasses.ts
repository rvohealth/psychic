import HttpStatusBadGateway from '../../error/http/BadGateway.js.js'
import HttpStatusBadRequest from '../../error/http/BadRequest.js.js'
import HttpStatusConflict from '../../error/http/Conflict.js.js'
import HttpStatusContentTooLarge from '../../error/http/ContentTooLarge.js.js'
import HttpStatusExpectationFailed from '../../error/http/ExpectationFailed.js.js'
import HttpStatusFailedDependency from '../../error/http/FailedDependency.js.js'
import HttpStatusForbidden from '../../error/http/Forbidden.js.js'
import HttpStatusGatewayTimeout from '../../error/http/GatewayTimeout.js.js'
import HttpStatusGone from '../../error/http/Gone.js.js'
import HttpStatusImATeapot from '../../error/http/ImATeapot.js.js'
import HttpStatusInsufficientStorage from '../../error/http/InsufficientStorage.js.js'
import HttpStatusInternalServerError from '../../error/http/InternalServerError.js.js'
import HttpStatusLocked from '../../error/http/Locked.js.js'
import HttpStatusMethodNotAllowed from '../../error/http/MethodNotAllowed.js.js'
import HttpStatusMisdirectedRequest from '../../error/http/MisdirectedRequest.js.js'
import HttpStatusNotAcceptable from '../../error/http/NotAcceptable.js.js'
import HttpStatusNotExtended from '../../error/http/NotExtended.js.js'
import HttpStatusNotFound from '../../error/http/NotFound.js.js'
import HttpStatusNotImplemented from '../../error/http/NotImplemented.js.js'
import HttpStatusPaymentRequired from '../../error/http/PaymentRequired.js.js'
import HttpStatusPreconditionFailed from '../../error/http/PreconditionFailed.js.js'
import HttpStatusPreconditionRequired from '../../error/http/PreconditionRequired.js.js'
import HttpStatusProxyAuthenticationRequired from '../../error/http/ProxyAuthenticationRequired.js.js'
import HttpStatusRequestHeaderFieldsTooLarge from '../../error/http/RequestHeaderFieldsTooLarge.js.js'
import HttpStatusServiceUnavailable from '../../error/http/ServiceUnavailable.js.js'
import HttpStatusTooManyRequests from '../../error/http/TooManyRequests.js.js'
import HttpStatusUnauthorized from '../../error/http/Unauthorized.js.js'
import HttpStatusUnavailableForLegalReasons from '../../error/http/UnavailableForLegalReasons.js.js'
import HttpStatusUnprocessableContent from '../../error/http/UnprocessableContent.js.js'
import HttpStatusUnsupportedMediaType from '../../error/http/UnsupportedMediaType.js.js'

export default function httpErrorClasses() {
  const clientErrorClasses = [
    HttpStatusBadRequest, // 400
    HttpStatusUnauthorized, // 401
    HttpStatusPaymentRequired, // 402
    HttpStatusForbidden, // 403
    HttpStatusNotFound, // 404
    HttpStatusMethodNotAllowed, // 405
    HttpStatusNotAcceptable, // 406
    HttpStatusProxyAuthenticationRequired, // 407
    HttpStatusConflict, // 409
    HttpStatusGone, // 410
    HttpStatusPreconditionFailed, // 412
    HttpStatusContentTooLarge, // 413
    HttpStatusUnsupportedMediaType, // 415
    HttpStatusExpectationFailed, // 417
    HttpStatusImATeapot, // 418
    HttpStatusMisdirectedRequest, // 421
    HttpStatusUnprocessableContent, // 422
    HttpStatusLocked, // 423
    HttpStatusFailedDependency, // 424
    HttpStatusPreconditionRequired, // 428
    HttpStatusTooManyRequests, // 429
    HttpStatusRequestHeaderFieldsTooLarge, // 431
    HttpStatusUnavailableForLegalReasons, // 451
  ] as const

  const serverErrorClasses = [
    HttpStatusInternalServerError, // 500
    HttpStatusNotImplemented, // 501
    HttpStatusBadGateway, // 502
    HttpStatusServiceUnavailable, // 503
    HttpStatusGatewayTimeout, // 504
    HttpStatusInsufficientStorage, // 507
    HttpStatusNotExtended, // 510
  ] as const

  return [...clientErrorClasses, ...serverErrorClasses]
}

export function rescuableHttpErrorClasses() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unrescuableClasses = [HttpStatusInternalServerError] as any[]

  return httpErrorClasses().filter(klass => !unrescuableClasses.includes(klass))
}
