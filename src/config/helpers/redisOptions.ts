import PsychicConfig from '..'

export interface PsychicRedisConnectionOptions {
  secure?: boolean
  host?: string
  port?: string
  username?: string
  password?: string
}

export type RedisOptionPurpose = 'ws' | 'background_jobs'
export default async function redisOptions(purpose: RedisOptionPurpose) {
  const psyConf = await PsychicConfig.bootForReading()

  switch (purpose) {
    case 'ws':
      return psyConf.redisWsCredentials

    case 'background_jobs':
      return psyConf.redisBackgroundJobCredentials

    default:
      throw new Error(`unexpected redis purpose encountered: ${purpose as string}`)
  }
}
