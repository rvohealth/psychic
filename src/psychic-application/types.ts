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
