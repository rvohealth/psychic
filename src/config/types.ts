export type UUID = string

export type PsychicHookEventType =
  | 'after:routes'
  | 'boot'
  | 'load'
  | 'load:dev'
  | 'load:prod'
  | 'load:test'
  | 'server_error'

export type PsychicHookLoadEventTypes = Exclude<PsychicHookEventType, 'server_error'>
