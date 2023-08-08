import { hyphenize } from 'dream'
import absoluteSrcPath from '../../helpers/absoluteSrcPath'
import importFileWithDefault from '../../helpers/importFileWithDefault'

export interface PsychicRedisConnectionOptions {
  secure?: boolean
  host?: string
  port?: string
  username?: string
  password?: string
}

export type RedisOptionPurpose = 'ws' | 'background_jobs'
export default async function redisOptions(purpose: RedisOptionPurpose) {
  const redisConf = await importFileWithDefault(absoluteSrcPath(`/conf/redis/${hyphenize(purpose)}`))
  return redisConf as () => Promise<PsychicRedisConnectionOptions>
}
