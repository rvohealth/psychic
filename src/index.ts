import * as _pluralize from 'pluralize'
export const pluralize = _pluralize

export {
  db,
  dream,
  Column,
  BelongsTo,
  HasMany,
  HasOne,
  AfterCreate,
  AfterDestroy,
  AfterSave,
  AfterUpdate,
  BeforeCreate,
  BeforeDestroy,
  BeforeSave,
  BeforeUpdate,
  Validates,
  Presence,
  STI,
  Scope,
  ValidationError,
} from 'dream'

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
export { default as PsychicSerializer } from './serializer'
export { default as Params } from './server/params'
export { default as PsychicSession } from './session'
export { UUID } from './config/types'
export { HttpMethod } from './router/types'
export { default as background } from './background'
export { default as generateResource } from './generate/resource'
export { default as generateController } from './generate/controller'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
export { default as camelize } from './helpers/camelize'
export { default as pascalize } from './helpers/pascalize'
export { default as snakeify } from './helpers/snakeify'
export { default as hyphenize } from './helpers/hyphenize'
