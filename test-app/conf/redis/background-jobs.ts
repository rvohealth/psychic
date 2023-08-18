import { PsychicRedisConnectionOptions } from '../../../src'

export default async (): Promise<PsychicRedisConnectionOptions> => {
  const username = process.env.REDIS_USER
  const password = process.env.REDIS_PASSWORD
  const host = process.env.REDIS_HOST
  const port = process.env.REDIS_PORT
  const secure = process.env.REDIS_USE_SSL === '1'

  return {
    username,
    password,
    host,
    port,
    secure,
  }
}
