import PsychicApp from './index.js'

export type UUID = string

export type PsychicHookEventType =
  | 'cli:sync'
  | 'server:init:before-middleware'
  | 'server:init:after-middleware'
  | 'server:init:after-routes'
  | 'server:start'
  | 'server:error'
  | 'server:shutdown'

export type PsychicAppInitializerCb = (psychicApp: PsychicApp) => void | Promise<void>

export const PsychicUseEventTypeValues = ['before-middleware', 'after-middleware', 'after-routes'] as const
export type PsychicUseEventType = (typeof PsychicUseEventTypeValues)[number]

type Only<T, U> = T & Partial<Record<Exclude<keyof U, keyof T>, never>>
export type Either<T, U> = Only<T, U> | Only<U, T>
