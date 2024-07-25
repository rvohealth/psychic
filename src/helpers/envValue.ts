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

export type AllowedEnv =
  | 'NODE_ENV'
  | 'APP_ROOT_PATH'
  | 'APP_ENCRYPTION_KEY'
  | 'WORKER_COUNT'
  | 'PSYCHIC_CORE_DEVELOPMENT'
  | 'AUTH_SESSION_KEY'
  | 'PORT'
  | 'DEV_SERVER_PORT'

export type AllowedBoolEnv =
  | 'DEBUG'
  | 'PSYCHIC_CORE_DEVELOPMENT'
  | 'TS_SAFE'
  | 'PSYCHIC_OMIT_DIST_FOLDER'
  | 'CLIENT'
  | 'PSYCHIC_DANGEROUSLY_PERMIT_WS_EXCEPTIONS'

export type AllowedDevBoolEnv = 'REALLY_TEST_BACKGROUND_QUEUE' | 'PSYCHIC_EXPECTING_INTERNAL_SERVER_ERROR'
