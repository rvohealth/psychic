export type UUID = string

export type PsychicHookEventType =
  | 'after:routes'
  | 'boot'
  | 'sync'
  | 'load'
  | 'load:dev'
  | 'load:prod'
  | 'load:test'
  | 'server:init'
  | 'server:start'
  | 'server:error'
  | 'server:shutdown'
  | 'ws:connect'
  | 'ws:start'
  | 'workers:shutdown'

export type PsychicHookLoadEventTypes = Exclude<
  PsychicHookEventType,
  | 'server:error'
  | 'ws:connect'
  | 'ws:start'
  | 'workers:shutdown'
  | 'server:init'
  | 'server:start'
  | 'server:shutdown'
  | 'after:routes'
  | 'sync'
>

type Only<T, U> = T & Partial<Record<Exclude<keyof U, keyof T>, never>>
export type Either<T, U> = Only<T, U> | Only<U, T>
