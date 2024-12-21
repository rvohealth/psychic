export type UUID = string

export type PsychicHookEventType =
  | 'after:routes'
  | 'boot'
  | 'server:init'
  | 'load'
  | 'load:dev'
  | 'load:prod'
  | 'load:test'
  | 'server:error'
  | 'ws:connect'
  | 'ws:start'

export type PsychicHookLoadEventTypes = Exclude<
  PsychicHookEventType,
  'server:error' | 'ws:connect' | 'ws:start' | 'server:init' | 'after:routes'
>

type Only<T, U> = T & Partial<Record<Exclude<keyof U, keyof T>, never>>
export type Either<T, U> = Only<T, U> | Only<U, T>
