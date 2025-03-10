import HttpStatusBadGateway from '../../error/http/BadGateway.js'
import HttpStatusBadRequest from '../../error/http/BadRequest.js'
import HttpStatusConflict from '../../error/http/Conflict.js'
import HttpStatusExpectationFailed from '../../error/http/ExpectationFailed.js'
import HttpStatusFailedDependency from '../../error/http/FailedDependency.js'
import HttpStatusForbidden from '../../error/http/Forbidden.js'
import HttpStatusGatewayTimeout from '../../error/http/GatewayTimeout.js'
import HttpStatusGone from '../../error/http/Gone.js'
import HttpStatusImATeapot from '../../error/http/ImATeapot.js'
import HttpStatusInsufficientStorage from '../../error/http/InsufficientStorage.js'
import HttpStatusInternalServerError from '../../error/http/InternalServerError.js'
import HttpStatusLocked from '../../error/http/Locked.js'
import HttpStatusMethodNotAllowed from '../../error/http/MethodNotAllowed.js'
import HttpStatusMisdirectedRequest from '../../error/http/MisdirectedRequest.js'
import HttpStatusNotAcceptable from '../../error/http/NotAcceptable.js'
import HttpStatusNotExtended from '../../error/http/NotExtended.js'
import HttpStatusNotFound from '../../error/http/NotFound.js'
import HttpStatusNotImplemented from '../../error/http/NotImplemented.js'
import HttpStatusContentTooLarge from '../../error/http/ContentTooLarge.js'
import HttpStatusPaymentRequired from '../../error/http/PaymentRequired.js'
import HttpStatusPreconditionFailed from '../../error/http/PreconditionFailed.js'
import HttpStatusPreconditionRequired from '../../error/http/PreconditionRequired.js'
import HttpStatusProxyAuthenticationRequired from '../../error/http/ProxyAuthenticationRequired.js'
import HttpStatusRequestHeaderFieldsTooLarge from '../../error/http/RequestHeaderFieldsTooLarge.js'
import HttpStatusServiceUnavailable from '../../error/http/ServiceUnavailable.js'
import HttpStatusTooManyRequests from '../../error/http/TooManyRequests.js'
import HttpStatusUnauthorized from '../../error/http/Unauthorized.js'
import HttpStatusUnavailableForLegalReasons from '../../error/http/UnavailableForLegalReasons.js'
import HttpStatusUnprocessableContent from '../../error/http/UnprocessableContent.js'
import HttpStatusUnsupportedMediaType from '../../error/http/UnsupportedMediaType.js'

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
