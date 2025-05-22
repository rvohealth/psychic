import _pluralize from 'pluralize-esm'
export const pluralize = _pluralize

export { default as PsychicBin } from './bin/index.js'
export { default as PsychicCLI } from './cli/index.js'
export { BeforeAction, OpenAPI } from './controller/decorators.js'
export {
  default as PsychicController,
  type PsychicOpenapiControllerConfig,
  type PsychicOpenapiNames,
} from './controller/index.js'
export { default as PsychicDevtools } from './devtools/PsychicDevtools.js'
export { default as envLoader } from './env/Loader.js'
export { default as I18nProvider } from './i18n/provider.js'

export { default as HttpStatusBadGateway } from './error/http/BadGateway.js'
export { default as HttpStatusBadRequest } from './error/http/BadRequest.js'
export { default as HttpStatusConflict } from './error/http/Conflict.js'
export { default as HttpStatusContentTooLarge } from './error/http/ContentTooLarge.js'
export { default as HttpStatusExpectationFailed } from './error/http/ExpectationFailed.js'
export { default as HttpStatusFailedDependency } from './error/http/FailedDependency.js'
export { default as HttpStatusForbidden } from './error/http/Forbidden.js'
export { default as HttpStatusGatewayTimeout } from './error/http/GatewayTimeout.js'
export { default as HttpStatusGone } from './error/http/Gone.js'
export { default as HttpStatusImATeapot } from './error/http/ImATeapot.js'
export { default as HttpStatusInsufficientStorage } from './error/http/InsufficientStorage.js'
export { default as HttpStatusInternalServerError } from './error/http/InternalServerError.js'
export { default as HttpStatusLocked } from './error/http/Locked.js'
export { default as HttpStatusMethodNotAllowed } from './error/http/MethodNotAllowed.js'
export { default as HttpStatusMisdirectedRequest } from './error/http/MisdirectedRequest.js'
export { default as HttpStatusNotAcceptable } from './error/http/NotAcceptable.js'
export { default as HttpStatusNotExtended } from './error/http/NotExtended.js'
export { default as HttpStatusNotFound } from './error/http/NotFound.js'
export { default as HttpStatusNotImplemented } from './error/http/NotImplemented.js'
export { default as HttpStatusPaymentRequired } from './error/http/PaymentRequired.js'
export { default as HttpStatusPreconditionFailed } from './error/http/PreconditionFailed.js'
export { default as HttpStatusPreconditionRequired } from './error/http/PreconditionRequired.js'
export { default as HttpStatusProxyAuthenticationRequired } from './error/http/ProxyAuthenticationRequired.js'
export { default as HttpStatusRequestHeaderFieldsTooLarge } from './error/http/RequestHeaderFieldsTooLarge.js'
export { default as HttpStatusServiceUnavailable } from './error/http/ServiceUnavailable.js'
export { default as HttpStatusTooManyRequests } from './error/http/TooManyRequests.js'
export { default as HttpStatusUnauthorized } from './error/http/Unauthorized.js'
export { default as HttpStatusUnavailableForLegalReasons } from './error/http/UnavailableForLegalReasons.js'
export { default as HttpStatusUnprocessableContent } from './error/http/UnprocessableContent.js'
export { default as HttpStatusUnsupportedMediaType } from './error/http/UnsupportedMediaType.js'

export { default as generateController } from './generate/controller.js'
export { default as generateResource } from './generate/resource.js'
export { default as cookieMaxAgeFromCookieOpts } from './helpers/cookieMaxAgeFromCookieOpts.js'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject.js'
export { type OpenapiResponseBody, type OpenapiRequestBody } from './helpers/openapiTypeHelpers.js'
export {
  MissingControllerActionPairingInRoutes,
  type OpenapiContent,
  type OpenapiEndpointRendererOpts,
  type OpenapiEndpointResponse,
  type OpenapiHeaderOption,
  type OpenapiHeaders,
  type OpenapiHeaderType,
  type OpenapiMethodBody,
  type OpenapiParameterResponse,
  type OpenapiPathParams,
  type OpenapiQueryOption,
  type OpenapiResponses,
  type OpenapiSchema,
  type OpenapiPathParamOption as OpenapiUriOption,
} from './openapi-renderer/endpoint.js'
export { default as PsychicImporter } from './psychic-app/helpers/PsychicImporter.js'
export {
  default as PsychicApp,
  type DefaultPsychicOpenapiOptions,
  type NamedPsychicOpenapiOptions,
  type PsychicAppInitOptions,
} from './psychic-app/index.js'
export { type UUID } from './psychic-app/types.js'
export { default as PsychicRouter } from './router/index.js'
export { type HttpMethod } from './router/types.js'
export { createPsychicHttpInstance as getPsychicHttpInstance } from './server/helpers/startPsychicServer.js'
export { default as PsychicServer } from './server/index.js'
export { default as Params } from './server/params.js'
export { default as ParamValidationError } from './error/controller/ParamValidationError.js'
export { default as ParamValidationErrors } from './error/controller/ParamValidationErrors.js'
export { default as PsychicSession } from './session/index.js'
