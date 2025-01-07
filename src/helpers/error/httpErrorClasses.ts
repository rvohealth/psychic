import HttpStatusBadGateway from '../../error/http/BadGateway'
import HttpStatusBadRequest from '../../error/http/BadRequest'
import HttpStatusConflict from '../../error/http/Conflict'
import HttpStatusExpectationFailed from '../../error/http/ExpectationFailed'
import HttpStatusFailedDependency from '../../error/http/FailedDependency'
import HttpStatusForbidden from '../../error/http/Forbidden'
import HttpStatusGatewayTimeout from '../../error/http/GatewayTimeout'
import HttpStatusGone from '../../error/http/Gone'
import HttpStatusImATeapot from '../../error/http/ImATeapot'
import HttpStatusInsufficientStorage from '../../error/http/InsufficientStorage'
import HttpStatusInternalServerError from '../../error/http/InternalServerError'
import HttpStatusLocked from '../../error/http/Locked'
import HttpStatusMethodNotAllowed from '../../error/http/MethodNotAllowed'
import HttpStatusMisdirectedRequest from '../../error/http/MisdirectedRequest'
import HttpStatusNotAcceptable from '../../error/http/NotAcceptable'
import HttpStatusNotExtended from '../../error/http/NotExtended'
import HttpStatusNotFound from '../../error/http/NotFound'
import HttpStatusNotImplemented from '../../error/http/NotImplemented'
import HttpStatusContentTooLarge from '../../error/http/ContentTooLarge'
import HttpStatusPaymentRequired from '../../error/http/PaymentRequired'
import HttpStatusPreconditionFailed from '../../error/http/PreconditionFailed'
import HttpStatusPreconditionRequired from '../../error/http/PreconditionRequired'
import HttpStatusProxyAuthenticationRequired from '../../error/http/ProxyAuthenticationRequired'
import HttpStatusRequestHeaderFieldsTooLarge from '../../error/http/RequestHeaderFieldsTooLarge'
import HttpStatusServiceUnavailable from '../../error/http/ServiceUnavailable'
import HttpStatusTooManyRequests from '../../error/http/TooManyRequests'
import HttpStatusUnauthorized from '../../error/http/Unauthorized'
import HttpStatusUnavailableForLegalReasons from '../../error/http/UnavailableForLegalReasons'
import HttpStatusUnprocessableContent from '../../error/http/UnprocessableContent'
import HttpStatusUnsupportedMediaType from '../../error/http/UnsupportedMediaType'

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
