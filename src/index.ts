import _pluralize from 'pluralize'
export const pluralize = _pluralize

export { default as PsychicBin } from './bin'
export { default as PsychicCLI } from './cli'
export {
  default as PsychicController,
  PsychicOpenapiNames,
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
} from './controller'
export { BeforeAction, OpenAPI } from './controller/decorators'
export { default as envLoader } from './env/Loader'

export { default as HttpStatusBadGateway } from './error/http/BadGateway'
export { default as HttpStatusBadRequest } from './error/http/BadRequest'
export { default as HttpStatusConflict } from './error/http/Conflict'
export { default as HttpStatusContentTooLarge } from './error/http/ContentTooLarge'
export { default as HttpStatusExpectationFailed } from './error/http/ExpectationFailed'
export { default as HttpStatusFailedDependency } from './error/http/FailedDependency'
export { default as HttpStatusForbidden } from './error/http/Forbidden'
export { default as HttpStatusGatewayTimeout } from './error/http/GatewayTimeout'
export { default as HttpStatusGone } from './error/http/Gone'
export { default as HttpStatusImATeapot } from './error/http/ImATeapot'
export { default as HttpStatusInsufficientStorage } from './error/http/InsufficientStorage'
export { default as HttpStatusInternalServerError } from './error/http/InternalServerError'
export { default as HttpStatusLocked } from './error/http/Locked'
export { default as HttpStatusMethodNotAllowed } from './error/http/MethodNotAllowed'
export { default as HttpStatusMisdirectedRequest } from './error/http/MisdirectedRequest'
export { default as HttpStatusNotAcceptable } from './error/http/NotAcceptable'
export { default as HttpStatusNotExtended } from './error/http/NotExtended'
export { default as HttpStatusNotFound } from './error/http/NotFound'
export { default as HttpStatusNotImplemented } from './error/http/NotImplemented'
export { default as HttpStatusPaymentRequired } from './error/http/PaymentRequired'
export { default as HttpStatusPreconditionFailed } from './error/http/PreconditionFailed'
export { default as HttpStatusPreconditionRequired } from './error/http/PreconditionRequired'
export { default as HttpStatusProxyAuthenticationRequired } from './error/http/ProxyAuthenticationRequired'
export { default as HttpStatusRequestHeaderFieldsTooLarge } from './error/http/RequestHeaderFieldsTooLarge'
export { default as HttpStatusServiceUnavailable } from './error/http/ServiceUnavailable'
export { default as HttpStatusTooManyRequests } from './error/http/TooManyRequests'
export { default as HttpStatusUnauthorized } from './error/http/Unauthorized'
export { default as HttpStatusUnavailableForLegalReasons } from './error/http/UnavailableForLegalReasons'
export { default as HttpStatusUnprocessableContent } from './error/http/UnprocessableContent'
export { default as HttpStatusUnsupportedMediaType } from './error/http/UnsupportedMediaType'

export { default as generateController } from './generate/controller'
export { default as generateResource } from './generate/resource'
export { default as cookieMaxAgeFromCookieOpts } from './helpers/cookieMaxAgeFromCookieOpts'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
export {
  MissingControllerActionPairingInRoutes,
  OpenapiContent,
  OpenapiEndpointRendererOpts,
  OpenapiEndpointResponse,
  OpenapiHeaderOption,
  OpenapiHeaderType,
  OpenapiHeaders,
  OpenapiMethodBody,
  OpenapiParameterResponse,
  OpenapiPathParams,
  OpenapiQueryOption,
  OpenapiResponses,
  OpenapiSchema,
  OpenapiPathParamOption as OpenapiUriOption,
} from './openapi-renderer/endpoint'
export {
  default as PsychicApplication,
  DefaultPsychicOpenapiOptions,
  NamedPsychicOpenapiOptions,
  PsychicApplicationInitOptions,
} from './psychic-application'
export { UUID } from './psychic-application/types'
export { default as PsychicRouter } from './router'
export { HttpMethod } from './router/types'
export { default as PsychicServer } from './server'
export { createPsychicHttpInstance as getPsychicHttpInstance } from './server/helpers/startPsychicServer'
export { default as Params, ParamValidationError } from './server/params'
export { default as PsychicSession } from './session'
