import { getCachedPsychicApplicationOrFail } from '../cache'

export interface PsychicRedisConnectionOptions {
  secure?: boolean
  host?: string
  port?: string
  username?: string
  password?: string
}

export type RedisOptionPurpose = 'ws' | 'background_jobs'
export default function redisOptions(purpose: RedisOptionPurpose) {
  const psychicApp = getCachedPsychicApplicationOrFail()

  switch (purpose) {
    case 'ws':
      return psychicApp.redisWsCredentials

    case 'background_jobs':
      return psychicApp.redisBackgroundJobCredentials

    default:
      throw new Error(`unexpected redis purpose encountered: ${purpose as string}`)
  }
}
