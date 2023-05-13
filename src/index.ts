import _pluralize from 'pluralize'
export const pluralize = _pluralize

export {
  db,
  Dream,
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
  STI,
  Scope,
  ValidationError,
  IdType,
  capitalize,
  uncapitalize,
  camelize,
  pascalize,
  snakeify,
  hyphenize,
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
export { default as Attribute } from './serializer/decorators/attribute'
export { default as RendersMany } from './serializer/decorators/associations/renders-many'
export { default as RendersOne } from './serializer/decorators/associations/renders-one'
export { default as Params } from './server/params'
export { default as PsychicSession } from './session'
export { UUID } from './config/types'
export { HttpMethod } from './router/types'
export { default as background } from './background'
export { default as generateResource } from './generate/resource'
export { default as generateController } from './generate/controller'
export { default as pathifyNestedObject } from './helpers/pathifyNestedObject'
