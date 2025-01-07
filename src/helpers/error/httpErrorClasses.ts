import BadRequest from '../../error/http/BadRequest'
import BadGateway from '../../error/http/BadGateway'
import Conflict from '../../error/http/Conflict'
import ExpectationFailed from '../../error/http/ExpectationFailed'
import FailedDependency from '../../error/http/FailedDependency'
import Forbidden from '../../error/http/Forbidden'
import GatewayTimeout from '../../error/http/GatewayTimeout'
import Gone from '../../error/http/Gone'
import HttpVersionNotSupported from '../../error/http/HttpVersionNotSupported'
import ImATeapot from '../../error/http/ImATeapot'
import InsufficientStorage from '../../error/http/InsufficientStorage'
import InternalServerError from '../../error/http/InternalServerError'
import LengthRequired from '../../error/http/LengthRequired'
import Locked from '../../error/http/Locked'
import LoopDetected from '../../error/http/LoopDetected'
import MethodNotAllowed from '../../error/http/MethodNotAllowed'
import MisdirectedRequest from '../../error/http/MisdirectedRequest'
import NetworkAuthenticationRequired from '../../error/http/NetworkAuthenticationRequired'
import NotFound from '../../error/http/NotFound'
import NotImplemented from '../../error/http/NotImplemented'
import NotAcceptable from '../../error/http/NotAcceptable'
import NotExtended from '../../error/http/NotExtended'
import PayloadTooLarge from '../../error/http/PayloadTooLarge'
import PaymentRequired from '../../error/http/PaymentRequired'
import PreconditionFailed from '../../error/http/PreconditionFailed'
import PreconditionRequired from '../../error/http/PreconditionRequired'
import ProxyAuthenticationRequired from '../../error/http/ProxyAuthenticationRequired'
import RangeNotSatisfiable from '../../error/http/RangeNotSatisfiable'
import RequestHeaderFieldsTooLarge from '../../error/http/RequestHeaderFieldsTooLarge'
import RequestTimeout from '../../error/http/RequestTimeout'
import ServiceUnavailable from '../../error/http/ServiceUnavailable'
import TooEarly from '../../error/http/TooEarly'
import TooManyRequests from '../../error/http/TooManyRequests'
import Unauthorized from '../../error/http/Unauthorized'
import UnavailableForLegalReasons from '../../error/http/UnavailableForLegalReasons'
import UnprocessableEntity from '../../error/http/UnprocessableEntity'
import UnsupportedMediaType from '../../error/http/UnsupportedMediaType'
import UpgradeRequired from '../../error/http/UpgradeRequired'
import URITooLong from '../../error/http/URITooLong'
import VariantAlsoNegotiates from '../../error/http/VariantAlsoNegotiates'

export default function httpErrorClasses() {
  const clientErrorClasses = [
    BadRequest, // 400
    Unauthorized, // 401
    PaymentRequired, // 402
    Forbidden, // 403
    NotFound, // 404
    MethodNotAllowed, // 405
    NotAcceptable, // 406
    ProxyAuthenticationRequired, // 407
    RequestTimeout, // 408
    Conflict, // 409
    Gone, // 410
    LengthRequired, // 411
    PreconditionFailed, // 412
    PayloadTooLarge, // 413
    URITooLong, // 414
    UnsupportedMediaType, // 415
    RangeNotSatisfiable, // 416
    ExpectationFailed, // 417
    ImATeapot, // 418
    MisdirectedRequest, // 421
    UnprocessableEntity, // 422
    Locked, // 423
    FailedDependency, // 424
    TooEarly, // 425
    UpgradeRequired, // 426
    PreconditionRequired, // 428
    TooManyRequests, // 429
    RequestHeaderFieldsTooLarge, // 431
    UnavailableForLegalReasons, // 451
  ] as const

  const serverErrorClasses = [
    InternalServerError, // 500
    NotImplemented, // 501
    BadGateway, // 502
    ServiceUnavailable, // 503
    GatewayTimeout, // 504
    HttpVersionNotSupported, // 505
    VariantAlsoNegotiates, // 506
    InsufficientStorage, // 507
    LoopDetected, // 508
    NotExtended, // 510
    NetworkAuthenticationRequired, // 511
  ] as const

  return [...clientErrorClasses, ...serverErrorClasses]
}

export function rescuableHttpErrorClasses() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unrescuableClasses = [InternalServerError, UnprocessableEntity] as any[]

  return httpErrorClasses().filter(klass => !unrescuableClasses.includes(klass))
}
