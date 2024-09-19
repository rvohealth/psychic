export default function envValue(env: AllowedEnv) {
  return process.env[env]!
}

export function envInt(env: AllowedEnv): number | null {
  const val = envValue(env)
  if (typeof parseInt(val) === 'number') return parseInt(val)
  return null
}

export function envBool(env: AllowedBoolEnv) {
  return process.env[env] === '1'
}

export function devEnvBool(env: AllowedDevBoolEnv) {
  return process.env[env] === '1'
}

export function setEnvBool(env: AllowedBoolEnv, val: '1' | undefined) {
  process.env[env] = val
}

export type AllowedEnv = 'SPEC_SERVER_PORT' | 'NODE_ENV' | 'PORT' | 'PSYCHIC_CORE_DEVELOPMENT'

export type AllowedBoolEnv =
  | 'CLIENT'
  | 'DEBUG'
  | 'PSYCHIC_CORE_DEVELOPMENT'
  | 'PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS'
  | 'BYPASS_DB_CONNECTIONS_DURING_INIT'

export type AllowedDevBoolEnv = 'REALLY_TEST_BACKGROUND_QUEUE' | 'PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR'
