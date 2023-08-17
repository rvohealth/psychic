import _pluralize from 'pluralize'
export const pluralize = _pluralize

export { default as PsychicController } from './controller'
export { BeforeAction } from './controller/decorators'
export { default as PsychicConfig } from './config'
export { default as Encrypt } from './encryption/encrypt'
export { default as Hash } from './encryption/hash'
export { default as env } from './env'
export { default as Forbidden } from './error/http/forbidden'
export { default as NotFound } from './error/http/not-found'
export { default as Unauthorized } from './error/http/unauthorized'
export { default as UnprocessableEntity } from './error/http/unprocessable-entity'
export { default as log } from './log'
export { default as PsychicRouter } from './router'
export { default as PsychicServer } from './server'
export { default as Params } from './server/params'
export { default as PsychicSession } from './session'
export { UUID } from './config/types'
export { HttpMethod } from './router/types'
export { default as background } from './background'
export { default as backgroundedService } from './background/backgrounded-service'
export { default as generateResource } from './generate/resource'
export { default as generateController } from './generate/controller'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
export { default as route } from './helpers/route'
export { PsychicRedisConnectionOptions } from './config/helpers/redisOptions'
export { getPsychicHttpInstance } from './server/helpers/startPsychicServer'
