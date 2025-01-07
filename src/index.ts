import _pluralize from 'pluralize'
export const pluralize = _pluralize

export { default as background, BackgroundJobConfig, stopBackgroundWorkers } from './background'
export { default as BaseBackgroundedService } from './background/BaseBackgroundedService'
export { default as BaseScheduledService } from './background/BaseScheduledService'

export { default as PsychicBin } from './bin'
export { default as Ws } from './cable/ws'
export { default as PsychicCLI } from './cli'
export {
  default as PsychicController,
  PsychicOpenapiNames,
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
} from './controller'
export { BeforeAction, OpenAPI } from './controller/decorators'
export { default as envLoader } from './env/Loader'
export { default as Forbidden } from './error/http/Forbidden'
export { default as NotFound } from './error/http/NotFound'
export { default as Unauthorized } from './error/http/Unauthorized'
export { default as UnprocessableEntity } from './error/http/UnprocessableEntity'
export { default as generateController } from './generate/controller'
export { default as generateResource } from './generate/resource'
export { default as cookieMaxAgeFromCookieOpts } from './helpers/cookieMaxAgeFromCookieOpts'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
export { default as log } from './log'
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
} from './psychic-application'
export { UUID } from './psychic-application/types'
export { default as PsychicRouter } from './router'
export { HttpMethod } from './router/types'
export { default as PsychicServer } from './server'
export { getPsychicHttpInstance } from './server/helpers/startPsychicServer'
export { default as Params, ParamValidationError } from './server/params'
export { default as PsychicSession } from './session'
