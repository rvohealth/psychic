import _pluralize from 'pluralize'
export const pluralize = _pluralize

export { default as developmentOrTestEnv } from '../boot/cli/helpers/developmentOrTestEnv'
export { default as background, stopBackgroundWorkers } from './background'
export { default as backgroundedFunction } from './background/backgrounded-function'
export { default as backgroundedService } from './background/backgrounded-service'
export { default as Ws } from './cable/ws'
export { default as PsychicController, PsychicParamsDictionary, PsychicParamsPrimitive } from './controller'
export { BeforeAction, OpenAPI } from './controller/decorators'
export { default as Encrypt } from './encryption/encrypt'
export { default as Hash } from './encryption/hash'
export { default as env } from './env'
export { default as Forbidden } from './error/http/forbidden'
export { default as NotFound } from './error/http/not-found'
export { default as Unauthorized } from './error/http/unauthorized'
export { default as UnprocessableEntity } from './error/http/unprocessable-entity'
export { default as generateController } from './generate/controller'
export { default as generateResource } from './generate/resource'
export { default as cookieMaxAgeFromCookieOpts } from './helpers/cookieMaxAgeFromCookieOpts'
export { default as loadRepl } from './helpers/loadRepl'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
export { default as log } from './log'
export {
  MissingControllerActionPairingInRoutes,
  OpenapiContent,
  OpenapiEndpointRendererOpts,
  OpenapiEndpointResponse,
  OpenapiHeaderOption,
  OpenapiHeaderType,
  OpenapiMethodBody,
  OpenapiParameterResponse,
  OpenapiQueryOption,
  OpenapiResponses,
  OpenapiSchema,
  OpenapiPathParamOption as OpenapiUriOption,
} from './openapi-renderer/endpoint'
export { PsychicOpenapiOptions, default as Psyconf } from './psyconf'
export { PsychicRedisConnectionOptions } from './psyconf/helpers/redisOptions'
export { UUID } from './psyconf/types'
export { default as PsychicRouter } from './router'
export { HttpMethod } from './router/types'
export { default as scheduledService } from './scheduled/scheduled-service'
export { default as PsychicServer } from './server'
export { getPsychicHttpInstance } from './server/helpers/startPsychicServer'
export { default as Params } from './server/params'
export { default as PsychicSession } from './session'
